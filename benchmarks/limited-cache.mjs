import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = join(dirname(fileURLToPath(import.meta.url)), '..');
const requireFromRepository = createRequire(join(repository, 'package.json'));
const defaultBaselineRef = 'faf60b4a0fc85bb40943f7c871c9d9d5bb9abbc2';
const baselineArgument = process.argv.indexOf('--baseline');
const baselineRef =
	process.env.SEYFERT_CACHE_BENCH_BASELINE ??
	(baselineArgument === -1 ? defaultBaselineRef : process.argv[baselineArgument + 1]);
if (!baselineRef) throw new Error('Expected a git ref after --baseline');
const baselineSha = execFileSync('git', ['rev-parse', '--verify', `${baselineRef}^{commit}`], {
	cwd: repository,
	encoding: 'utf8',
}).trim();
const mebibyte = 1024 * 1024;
const minimumRepetitions = 7;
const maximumRepetitions = 11;
const minimumMeasuredMilliseconds = 1_000;
const warmupWrites = 20_000;
const expectedRelationships = new WeakMap();
let trackExpectedRelationships = false;
const arms = [
	{ id: 'memory-head', label: 'Memory baseline' },
	{ id: 'memory-final', label: 'Memory working tree' },
	{ id: 'limited-head', label: 'Limited baseline' },
	{ id: 'limited-final', label: 'Limited working tree' },
];
const comparisons = [
	{ baseline: 'memory-head', candidate: 'memory-final', label: 'Memory working tree compared with Memory baseline' },
	{ baseline: 'limited-head', candidate: 'limited-final', label: 'Limited working tree compared with Limited baseline' },
	{
		baseline: 'limited-final',
		candidate: 'memory-final',
		label: 'Memory working tree compared with Limited working tree',
	},
];
const messageProbes = [
	{ key: 'message.0', relationship: 'message.channel-0' },
	{ key: 'message.100000', relationship: 'message.channel-0' },
	{ key: 'message.199999', relationship: 'message.channel-19999' },
];

const scenarios = [
	{
		id: 'no-ttl',
		label: 'No TTL',
		description: '250k adapter sets with one relationship each and unlimited retention',
		writes: 250_000,
		expectedEntries: 250_000,
		probes: [
			{ key: 'user.0', relationship: 'user' },
			{ key: 'user.125000', relationship: 'user' },
			{ key: 'user.249999', relationship: 'user' },
		],
		write: writeUser,
	},
	{
		id: 'many-buckets',
		label: 'Many buckets',
		description: '200k channel inserts, each in a separate guild bucket, without TTL',
		writes: 200_000,
		expectedEntries: 200_000,
		probes: [
			{ key: 'channel.0', relationship: 'channel.guild-0' },
			{ key: 'channel.100000', relationship: 'channel.guild-100000' },
			{ key: 'channel.199999', relationship: 'channel.guild-199999' },
		],
		write: writeChannel,
	},
	{
		id: 'bounded',
		label: 'Bounded retention',
		description: '250k adapter sets with one relationship each, with Limited variants capped at 50k',
		writes: 250_000,
		expectedEntries: 250_000,
		expectedLimitedEntries: 50_000,
		probes: [
			{ key: 'user.0', relationship: 'user' },
			{ key: 'user.249999', relationship: 'user' },
		],
		limitedProbes: [
			{ key: 'user.0', relationship: 'user', present: false },
			{ key: 'user.200000', relationship: 'user' },
			{ key: 'user.249999', relationship: 'user' },
		],
		write: writeUser,
		adapterOptions: { default: { limit: 50_000 } },
	},
	{
		id: 'ttl-wave',
		label: 'TTL expiration wave',
		description: '200k adapter sets with one relationship each, with Limited variants expiring after 3s',
		writes: 200_000,
		expectedEntries: 200_000,
		expectedLimitedEntries: 0,
		probes: [
			{ key: 'user.0', relationship: 'user' },
			{ key: 'user.199999', relationship: 'user' },
		],
		limitedProbes: [
			{ key: 'user.0', relationship: 'user', present: false },
			{ key: 'user.199999', relationship: 'user', present: false },
		],
		write: writeUser,
		adapterOptions: { default: { expire: 3_000 } },
		waitForCleanup: true,
	},
	{
		id: 'mixed',
		label: 'Mixed reads and writes',
		description: '200k inserts followed by 800k deterministic operations: 80% reads and 20% writes',
		writes: 200_000,
		expectedEntries: 220_000,
		probes: [
			{ key: 'user.0', relationship: 'user' },
			{ key: 'user.200000', relationship: 'user' },
			{ key: 'user.299995', relationship: 'user' },
		],
		write: writeUser,
		mixedOperations: 800_000,
	},
	{
		id: 'reads',
		label: 'Steady reads',
		description: '200k retained user entries followed by 1m deterministic reads',
		writes: 0,
		preloadWrites: 200_000,
		readOperations: 1_000_000,
		expectedEntries: 200_000,
		probes: [
			{ key: 'user.0', relationship: 'user' },
			{ key: 'user.100000', relationship: 'user' },
			{ key: 'user.199999', relationship: 'user' },
		],
		write: writeUser,
	},
	{
		id: 'indexed-misses',
		label: 'Indexed cache misses',
		description: '6,680 retained channel buckets followed by 10k missing channel reads',
		writes: 0,
		preloadWrites: 6_680,
		readOperations: 10_000,
		expectedEntries: 6_680,
		probes: [
			{ key: 'channel.0', relationship: 'channel.guild-0' },
			{ key: 'channel.3339', relationship: 'channel.guild-3339' },
			{ key: 'channel.6679', relationship: 'channel.guild-6679' },
		],
		write: writeChannel,
		read: readMissingChannel,
	},
	{
		id: 'bulk',
		label: 'Bulk writes',
		description: '200k user writes in 1k-entry batches, with one repeated ID per batch',
		writes: 200_000,
		expectedEntries: 199_800,
		probes: [
			{ key: 'user.0', relationship: 'user' },
			{ key: 'user.998', relationship: 'user' },
			{ key: 'user.999', relationship: 'user', present: false },
			{ key: 'user.199998', relationship: 'user' },
			{ key: 'user.199999', relationship: 'user', present: false },
		],
		batchSize: 1_000,
		writeBatch: writeUserBatch,
	},
	{
		id: 'message-writes',
		label: 'Message writes',
		description: '200k individual message writes distributed across 6,680 guild buckets and 20k channels',
		writes: 200_000,
		expectedEntries: 200_000,
		probes: messageProbes,
		write: writeMessage,
	},
	{
		id: 'message-bulk',
		label: 'Message bulk writes',
		description: '200k message writes in 1k-entry batches across 6,680 guild buckets and 20k channels',
		writes: 200_000,
		expectedEntries: 200_000,
		probes: messageProbes,
		batchSize: 1_000,
		writeBatch: writeMessageBatch,
	},
	{
		id: 'message-hits',
		label: 'Message cache hits',
		description: '200k retained messages followed by 1m deterministic cache hits',
		writes: 0,
		preloadWrites: 200_000,
		readOperations: 1_000_000,
		expectedEntries: 200_000,
		probes: messageProbes,
		write: writeMessage,
		read: readMessage,
	},
	{
		id: 'message-misses',
		label: 'Message cache misses',
		description: '200k retained messages followed by 300k deterministic cache misses',
		writes: 0,
		preloadWrites: 200_000,
		readOperations: 300_000,
		expectedEntries: 200_000,
		probes: messageProbes,
		write: writeMessage,
		read: readMissingMessage,
	},
	{
		id: 'message-ttl',
		label: 'Message TTL expiration wave',
		description: '200k message writes across 6,680 guild buckets, expiring after 3s',
		writes: 200_000,
		expectedEntries: 200_000,
		expectedLimitedEntries: 0,
		probes: messageProbes,
		limitedProbes: messageProbes.map(probe => ({ ...probe, present: false })),
		write: writeMessage,
		adapterOptions: { message: { expire: 3_000 } },
		waitForCleanup: true,
	},
];

const scenarioArgument = process.argv.indexOf('--scenario');
const selectedScenarios =
	scenarioArgument === -1 ? scenarios : scenarios.filter(scenario => scenario.id === process.argv[scenarioArgument + 1]);
if (selectedScenarios.length === 0) throw new Error(`Unknown scenario ${process.argv[scenarioArgument + 1]}`);

function evaluateCommonJs(source, filename, dependencies) {
	const typescript = requireFromRepository('typescript');
	const output = typescript.transpileModule(source, {
		compilerOptions: {
			module: typescript.ModuleKind.CommonJS,
			target: typescript.ScriptTarget.ES2022,
		},
		fileName: filename,
	}).outputText;
	const module = { exports: {} };
	const localRequire = specifier => {
		if (specifier in dependencies) return dependencies[specifier];
		throw new Error(`Unexpected dependency ${specifier} from ${filename}`);
	};
	new Function('require', 'module', 'exports', `${output}\n//# sourceURL=${filename}`)(
		localRequire,
		module,
		module.exports,
	);
	return module.exports;
}

function loadBaseline(path, dependencies) {
	return evaluateCommonJs(
		execFileSync('git', ['show', `${baselineSha}:${path}`], { cwd: repository, encoding: 'utf8' }),
		`baseline/${path}`,
		dependencies,
	);
}

function baselineHas(path) {
	return spawnSync('git', ['cat-file', '-e', `${baselineSha}:${path}`], { cwd: repository }).status === 0;
}

function loadAdapters() {
	const current = requireFromRepository(join(repository, 'lib/index.js'));
	const common = requireFromRepository(join(repository, 'lib/common/index.js'));
	const legacyCollection = loadBaseline('src/collection.ts', { './common': common });
	const baselineShared = baselineHas('src/cache/adapters/shared.ts')
		? loadBaseline('src/cache/adapters/shared.ts', { '../../common': common })
		: undefined;
	const legacyMemoryAdapter = loadBaseline('src/cache/adapters/default.ts', { './shared': baselineShared });
	const legacyLimitedAdapter = loadBaseline('src/cache/adapters/limited.ts', {
		'../..': { LimitedCollection: legacyCollection.LimitedCollection },
		'../../collection': legacyCollection,
		'../../common': common,
		'./shared': baselineShared,
	});

	return {
		FinalMemoryAdapter: current.MemoryAdapter,
		HeadMemoryAdapter: legacyMemoryAdapter.MemoryAdapter,
		FinalLimitedMemoryAdapter: current.LimitedMemoryAdapter,
		HeadLimitedMemoryAdapter: legacyLimitedAdapter.LimitedMemoryAdapter,
	};
}

function isMemoryArm(arm) {
	return arm.startsWith('memory-');
}

function createAdapter(arm, scenario, adapters) {
	if (arm === 'memory-head') return new adapters.HeadMemoryAdapter();
	if (arm === 'memory-final') return new adapters.FinalMemoryAdapter();
	const Adapter = arm === 'limited-head' ? adapters.HeadLimitedMemoryAdapter : adapters.FinalLimitedMemoryAdapter;
	return new Adapter(scenario.adapterOptions);
}

function disposeAdapter(adapter, arm) {
	if (!isMemoryArm(arm)) {
		for (const bucket of [...adapter.storage.values()]) bucket.clear();
	}
	adapter.flush();
}

async function warmUp(arm, scenario, adapters) {
	const adapter = createAdapter(arm, scenario, adapters);
	const warmupScenario = {
		...scenario,
		writes: Math.min(scenario.writes, warmupWrites),
		preloadWrites: scenario.preloadWrites ? Math.min(scenario.preloadWrites, warmupWrites) : undefined,
		readOperations: scenario.readOperations ? Math.min(scenario.readOperations, warmupWrites * 4) : undefined,
		mixedOperations: scenario.mixedOperations ? Math.min(scenario.mixedOperations, warmupWrites * 4) : undefined,
		waitForCleanup: false,
	};
	await prepareWorkload(adapter, warmupScenario, () => {});
	await executeWorkload(
		adapter,
		warmupScenario,
		() => {},
	);
	disposeAdapter(adapter, arm);
	await immediate();
}

function hasBucketedStorage(adapter) {
	return 'keyToStorage' in adapter;
}

function countEntries(adapter, arm) {
	if (isMemoryArm(arm) && !hasBucketedStorage(adapter)) return adapter.storage.size;
	let entries = 0;
	for (const bucket of adapter.storage.values()) entries += bucket.size;
	return entries;
}

function countRelationshipIds(adapter, arm) {
	if (isMemoryArm(arm)) return countEntries(adapter, arm);
	let count = 0;
	if (usesAtomicWrites(adapter)) {
		for (const [namespace, storage] of adapter.storage) {
			for (const key of storage.keys()) {
				if (adapter.keyToRelationship?.has(key) || namespace === 'message' || namespace.startsWith('message.')) continue;
				count++;
			}
		}
		if (adapter.relationships) {
			for (const relationships of adapter.relationships.values()) {
				for (const ids of relationships.values()) count += ids.size;
			}
		}
	} else {
		for (const relation of adapter.relationships.values()) {
			for (const values of relation.values()) count += values.size;
		}
	}
	return count;
}

function trackRelationship(adapter, key, relationship) {
	if (!trackExpectedRelationships) return;
	let relationships = expectedRelationships.get(adapter);
	if (!relationships) {
		relationships = new Map();
		expectedRelationships.set(adapter, relationships);
	}
	relationships.set(key, relationship);
}

function countVerifiedRelationships(adapter) {
	let count = 0;
	for (const [key, [to, id]] of expectedRelationships.get(adapter) ?? []) {
		if (adapter.get(key) === null) continue;
		if (!adapter.contains(to, id)) throw new Error(`${key} is retained without its expected relationship ${to}:${id}`);
		count++;
	}
	return count;
}

function countBuckets(adapter, arm) {
	return isMemoryArm(arm) && !hasBucketedStorage(adapter) ? 1 : adapter.storage.size;
}

function countSchedules(adapter, arm) {
	if (isMemoryArm(arm) || !hasBucketedStorage(adapter)) return 0;
	let schedules = 0;
	for (const bucket of adapter.storage.values()) {
		if (bucket.expirationSchedule !== undefined) schedules++;
	}
	return schedules;
}

function retainedState(adapter, arm) {
	return {
		entries: countEntries(adapter, arm),
		buckets: countBuckets(adapter, arm),
		relationshipIds: countRelationshipIds(adapter, arm),
		indexes: (adapter.keyToStorage?.size ?? 0) + (adapter.keyToRelationship?.size ?? 0),
		schedules: countSchedules(adapter, arm),
	};
}

function usesAtomicWrites(adapter) {
	return adapter.set.length >= 3;
}

function setWithRelationship(adapter, key, value, relationship) {
	if (usesAtomicWrites(adapter)) {
		adapter.set(key, value, relationship);
		trackRelationship(adapter, key, relationship);
		return;
	}
	adapter.addToRelationship(relationship[0], relationship[1]);
	adapter.set(key, value);
	trackRelationship(adapter, key, relationship);
}

function writeUser(adapter, id) {
	const stringId = String(id);
	setWithRelationship(
		adapter,
		`user.${stringId}`,
		{ id: stringId, username: `member-${stringId}`, flags: id & 31 },
		['user', stringId],
	);
}

function writeChannel(adapter, id) {
	const stringId = String(id);
	setWithRelationship(
		adapter,
		`channel.${stringId}`,
		{
			id: stringId,
			guild_id: `guild-${stringId}`,
			name: `channel-${stringId}`,
		},
		[`channel.guild-${stringId}`, stringId],
	);
}

function messageEntry(id) {
	const stringId = String(id);
	const guildId = `guild-${id % 6_680}`;
	const channelId = `channel-${id % 20_000}`;
	return [
		`message.${stringId}`,
		{ id: stringId, guild_id: guildId, channel_id: channelId, content: `message-${stringId}` },
		[`message.${channelId}`, stringId],
	];
}

function writeMessage(adapter, id) {
	setWithRelationship(adapter, ...messageEntry(id));
}

function readMessage(adapter, randomState, scenario) {
	const id = String(randomState % scenario.preloadWrites);
	return adapter.get(`message.${id}`)?.id === id;
}

function readMissingMessage(adapter, randomState) {
	return adapter.get(`message.missing-${randomState}`) === null;
}

function readMissingChannel(adapter, randomState) {
	return adapter.get(`channel.missing-${randomState}`) === null;
}

function writeUserBatch(adapter, start, end) {
	const ids = [];
	const entries = [];
	for (let index = start; index < end; index++) {
		const id = String(index === end - 1 ? index - 1 : index);
		ids.push(id);
		entries.push([`user.${id}`, { id, username: `member-${id}`, flags: index & 31 }, ['user', id]]);
	}
	if (usesAtomicWrites(adapter)) {
		adapter.bulkSet(entries);
		for (const [key, , relationship] of entries) trackRelationship(adapter, key, relationship);
		return;
	}
	adapter.bulkAddToRelationShip({ user: ids });
	adapter.bulkSet(entries.map(([key, value]) => [key, value]));
	for (const [key, , relationship] of entries) trackRelationship(adapter, key, relationship);
}

function writeMessageBatch(adapter, start, end) {
	const entries = [];
	for (let index = start; index < end; index++) entries.push(messageEntry(index));
	if (usesAtomicWrites(adapter)) {
		adapter.bulkSet(entries);
		for (const [key, , relationship] of entries) trackRelationship(adapter, key, relationship);
		return;
	}
	const relationships = {};
	for (const [, , [to, id]] of entries) (relationships[to] ??= []).push(id);
	adapter.bulkAddToRelationShip(relationships);
	adapter.bulkSet(entries.map(([key, value]) => [key, value]));
	for (const [key, , relationship] of entries) trackRelationship(adapter, key, relationship);
}

const immediate = () => new Promise(resolve => setImmediate(resolve));
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function executeInChunks(total, operation, observe, chunkSize = 2_000) {
	for (let start = 0; start < total; start += chunkSize) {
		const end = Math.min(total, start + chunkSize);
		for (let index = start; index < end; index++) operation(index);
		observe();
		await immediate();
	}
}

async function prepareWorkload(adapter, scenario, observe) {
	if (!scenario.preloadWrites) return;
	await executeInChunks(scenario.preloadWrites, index => scenario.write(adapter, index), observe);
}

async function executeWorkload(adapter, scenario, observe) {
	const operationStart = performance.now();
	let operations = scenario.writes;
	let expectedReads = 0;
	let validatedReads = 0;
	if (scenario.writeBatch) {
		for (let start = 0; start < scenario.writes; start += scenario.batchSize) {
			scenario.writeBatch(adapter, start, Math.min(scenario.writes, start + scenario.batchSize));
			observe();
			await immediate();
		}
	} else {
		await executeInChunks(scenario.writes, index => scenario.write(adapter, index), observe);
	}

	if (scenario.mixedOperations) {
		let randomState = 0x5eedc0de;
		operations += scenario.mixedOperations;
		await executeInChunks(
			scenario.mixedOperations,
			index => {
				randomState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0;
				if (index % 5 === 0) writeUser(adapter, scenario.writes + (index % 100_000));
				else {
					const id = String(randomState % scenario.writes);
					expectedReads++;
					if (adapter.get(`user.${id}`)?.id === id) validatedReads++;
				}
			},
			observe,
		);
	}
	if (scenario.readOperations) {
		let randomState = 0x5eedc0de;
		operations += scenario.readOperations;
		await executeInChunks(
			scenario.readOperations,
			() => {
				randomState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0;
				expectedReads++;
				if (scenario.read) {
					if (scenario.read(adapter, randomState, scenario)) validatedReads++;
				} else {
					const id = String(randomState % scenario.preloadWrites);
					if (adapter.get(`user.${id}`)?.id === id) validatedReads++;
				}
			},
			observe,
		);
	}
	if (validatedReads !== expectedReads) {
		throw new Error(`validated ${validatedReads.toLocaleString()} of ${expectedReads.toLocaleString()} cache reads`);
	}

	const operationMilliseconds = performance.now() - operationStart;
	return { operations, operationMilliseconds, throughputOpsPerSecond: operations / (operationMilliseconds / 1_000) };
}

async function waitForCleanup(adapter, arm, scenario, observe) {
	if (!scenario.waitForCleanup || isMemoryArm(arm)) return null;
	const cleanupStart = performance.now();
	const cleanupDeadline = cleanupStart + 15_000;
	while (countEntries(adapter, arm) !== 0 && performance.now() < cleanupDeadline) {
		observe();
		await delay(5);
	}
	if (countEntries(adapter, arm) !== 0) throw new Error(`${arm} did not drain its TTL wave`);
	return performance.now() - cleanupStart;
}

function assertRetainedState(adapter, arm, scenario, retained) {
	const expectedEntries =
		!isMemoryArm(arm) && scenario.expectedLimitedEntries !== undefined
			? scenario.expectedLimitedEntries
			: scenario.expectedEntries;
	if (retained.entries !== expectedEntries || retained.relationshipIds !== expectedEntries) {
		throw new Error(
			`${arm} retained ${retained.entries.toLocaleString()} entries and ${retained.relationshipIds.toLocaleString()} relationships; expected ${expectedEntries.toLocaleString()} of each`,
		);
	}
	const probes = !isMemoryArm(arm) && scenario.limitedProbes ? scenario.limitedProbes : scenario.probes;
	for (const probe of probes) {
		const id = probe.key.slice(probe.key.lastIndexOf('.') + 1);
		const expectedPresent = probe.present ?? true;
		const valuePresent = adapter.get(probe.key)?.id === id;
		const relationshipPresent = adapter.contains(probe.relationship, id);
		if (valuePresent !== expectedPresent || relationshipPresent !== expectedPresent) {
			throw new Error(
				`${arm} probe ${probe.key} expected present=${expectedPresent}; get=${valuePresent}, contains=${relationshipPresent}`,
			);
		}
	}
}

async function verifyScenarioRelationships(arm, scenario, adapters) {
	const adapter = createAdapter(arm, scenario, adapters);
	trackExpectedRelationships = true;
	try {
		await prepareWorkload(adapter, scenario, () => {});
		await executeWorkload(adapter, scenario, () => {});
		await waitForCleanup(adapter, arm, scenario, () => {});
		const retained = retainedState(adapter, arm);
		assertRetainedState(adapter, arm, scenario, retained);
		const verifiedRelationships = countVerifiedRelationships(adapter);
		if (verifiedRelationships !== retained.relationshipIds) {
			throw new Error(
				`${arm} verified ${verifiedRelationships.toLocaleString()} retained relationships; found ${retained.relationshipIds.toLocaleString()} in adapter state`,
			);
		}
	} finally {
		trackExpectedRelationships = false;
		adapter.flush();
	}
}

async function runChild(arm, scenarioId) {
	const scenario = scenarios.find(candidate => candidate.id === scenarioId);
	if (!scenario) throw new Error(`Unknown scenario ${scenarioId}`);
	const adapters = loadAdapters();
	await warmUp(arm, scenario, adapters);
	globalThis.gc?.();
	await immediate();
	const adapter = createAdapter(arm, scenario, adapters);
	const baselineMemory = process.memoryUsage();
	let peakRss = baselineMemory.rss;
	const observe = () => {
		peakRss = Math.max(peakRss, process.memoryUsage().rss);
	};
	await prepareWorkload(adapter, scenario, observe);
	globalThis.gc?.();
	await immediate();
	observe();
	const eventLoopDelay = monitorEventLoopDelay({ resolution: 1 });
	eventLoopDelay.enable();
	await immediate();
	const cpuStart = process.cpuUsage();
	const workload = await executeWorkload(adapter, scenario, observe);
	const cleanupMilliseconds = await waitForCleanup(adapter, arm, scenario, observe);

	await immediate();
	observe();
	eventLoopDelay.disable();
	const cpu = process.cpuUsage(cpuStart);
	const retained = retainedState(adapter, arm);
	assertRetainedState(adapter, arm, scenario, retained);
	globalThis.gc?.();
	await immediate();
	const retainedMemory = process.memoryUsage();
	adapter.flush();
	if (process.env.SEYFERT_CACHE_BENCH_VERIFY_RELATIONSHIPS === '1') {
		await verifyScenarioRelationships(arm, scenario, adapters);
	}

	return {
		arm,
		scenario: scenario.id,
		...workload,
		cleanupMilliseconds,
		cpuMilliseconds: (cpu.user + cpu.system) / 1_000,
		peakRssDeltaMiB: (peakRss - baselineMemory.rss) / mebibyte,
		rssAfterGcDeltaMiB: (retainedMemory.rss - baselineMemory.rss) / mebibyte,
		heapAfterGcDeltaMiB: (retainedMemory.heapUsed - baselineMemory.heapUsed) / mebibyte,
		eventLoopP95Milliseconds: eventLoopDelay.percentile(95) / 1e6,
		eventLoopMaxMilliseconds: eventLoopDelay.max / 1e6,
		retained,
	};
}

function median(values) {
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function medianAbsoluteDeviation(values, middle = median(values)) {
	return median(values.map(value => Math.abs(value - middle)));
}

function summarize(runs) {
	const numericFields = [
		'throughputOpsPerSecond',
		'cpuMilliseconds',
		'peakRssDeltaMiB',
		'rssAfterGcDeltaMiB',
		'heapAfterGcDeltaMiB',
		'eventLoopP95Milliseconds',
		'eventLoopMaxMilliseconds',
	];
	const summary = {
		retained: runs.at(-1).retained,
		repetitions: runs.length,
		measuredMilliseconds: runs.reduce((total, run) => total + run.operationMilliseconds, 0),
		medianAbsoluteDeviations: {},
		medianAbsoluteDeviationPercentages: {},
	};
	for (const field of numericFields) {
		const values = runs.map(run => run[field]);
		const middle = median(values);
		const deviation = medianAbsoluteDeviation(values, middle);
		summary[field] = middle;
		summary.medianAbsoluteDeviations[field] = deviation;
		summary.medianAbsoluteDeviationPercentages[field] =
			middle === 0 ? 0 : (deviation / Math.abs(middle)) * 100;
	}
	const cleanup = runs.map(run => run.cleanupMilliseconds).filter(value => value !== null);
	summary.cleanupMilliseconds = cleanup.length ? median(cleanup) : null;
	const cleanupDeviation = cleanup.length ? medianAbsoluteDeviation(cleanup, summary.cleanupMilliseconds) : 0;
	summary.medianAbsoluteDeviations.cleanupMilliseconds = cleanupDeviation;
	summary.medianAbsoluteDeviationPercentages.cleanupMilliseconds =
		summary.cleanupMilliseconds === null || summary.cleanupMilliseconds === 0
			? 0
			: (cleanupDeviation / Math.abs(summary.cleanupMilliseconds)) * 100;
	return summary;
}

function formatNumber(value, fractionDigits = 1) {
	return value.toLocaleString('en-US', {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	});
}

function formatMetric(value, unit, fractionDigits = 1) {
	return `${formatNumber(value, fractionDigits)} ${unit}`;
}

function formatMeasuredMetric(summary, field, unit, fractionDigits = 1) {
	return `${formatMetric(summary[field], unit, fractionDigits)} ±${formatNumber(
		summary.medianAbsoluteDeviationPercentages[field],
	)}%`;
}

function describeRelativeChange(candidate, baseline) {
	const percentage = ((candidate - baseline) / baseline) * 100;
	if (Math.abs(percentage) < 0.05) return 'unchanged';
	return `${formatNumber(Math.abs(percentage))}% ${percentage > 0 ? 'higher' : 'lower'}`;
}

function describeAbsoluteChange(candidate, baseline, unit) {
	const difference = candidate - baseline;
	if (Math.abs(difference) < 0.05) return 'unchanged';
	return `${formatMetric(Math.abs(difference), unit)} ${difference > 0 ? 'higher' : 'lower'}`;
}

function describeCleanupChange(candidate, baseline) {
	if (candidate === null || baseline === null) return 'not applicable';
	const difference = candidate - baseline;
	if (Math.abs(difference) < 0.05) return 'unchanged';
	return `${formatMetric(Math.abs(difference), 'ms')} ${difference > 0 ? 'later' : 'earlier'}`;
}

function madBandsOverlap(candidate, baseline, field) {
	if (candidate[field] === null || baseline[field] === null) return false;
	return (
		Math.abs(candidate[field] - baseline[field]) <=
		candidate.medianAbsoluteDeviations[field] + baseline.medianAbsoluteDeviations[field]
	);
}

function markInconclusive(description, candidate, baseline, field) {
	if (description === 'unchanged' || description === 'not applicable') return description;
	return madBandsOverlap(candidate, baseline, field)
		? `${description} (inconclusive: MAD bands overlap)`
		: description;
}

function printMetricTable(summary) {
	console.table(
		arms.map(arm => {
			const value = summary[arm.id];
			return {
				Adapter: arm.label,
				'Throughput ↑': formatMeasuredMetric(value, 'throughputOpsPerSecond', 'ops/s', 0),
				'CPU ↓': formatMeasuredMetric(value, 'cpuMilliseconds', 'ms'),
				'RSS growth ↓': formatMeasuredMetric(value, 'peakRssDeltaMiB', 'MiB'),
				'RSS after GC ↓': formatMeasuredMetric(value, 'rssAfterGcDeltaMiB', 'MiB'),
				'Heap after GC ↓': formatMeasuredMetric(value, 'heapAfterGcDeltaMiB', 'MiB'),
				'Loop p95 ↓': formatMeasuredMetric(value, 'eventLoopP95Milliseconds', 'ms', 2),
				'Loop max ↓': formatMeasuredMetric(value, 'eventLoopMaxMilliseconds', 'ms', 2),
				'Cleanup wait ↓':
					value.cleanupMilliseconds === null
						? '-'
						: formatMeasuredMetric(value, 'cleanupMilliseconds', 'ms'),
			};
		}),
	);
}

function printComparison(summary, comparison) {
	const baseline = summary[comparison.baseline];
	const candidate = summary[comparison.candidate];
	console.log(`\n${comparison.label}:`);
	console.log(
		`  Throughput ↑     ${markInconclusive(
			describeRelativeChange(candidate.throughputOpsPerSecond, baseline.throughputOpsPerSecond),
			candidate,
			baseline,
			'throughputOpsPerSecond',
		)}`,
	);
	console.log(
		`  CPU time ↓       ${markInconclusive(
			describeRelativeChange(candidate.cpuMilliseconds, baseline.cpuMilliseconds),
			candidate,
			baseline,
			'cpuMilliseconds',
		)}`,
	);
	console.log(
		`  RSS growth ↓     ${markInconclusive(
			describeAbsoluteChange(candidate.peakRssDeltaMiB, baseline.peakRssDeltaMiB, 'MiB'),
			candidate,
			baseline,
			'peakRssDeltaMiB',
		)}`,
	);
	console.log(
		`  RSS after GC ↓   ${markInconclusive(
			describeAbsoluteChange(candidate.rssAfterGcDeltaMiB, baseline.rssAfterGcDeltaMiB, 'MiB'),
			candidate,
			baseline,
			'rssAfterGcDeltaMiB',
		)}`,
	);
	console.log(
		`  Heap after GC ↓  ${markInconclusive(
			describeAbsoluteChange(candidate.heapAfterGcDeltaMiB, baseline.heapAfterGcDeltaMiB, 'MiB'),
			candidate,
			baseline,
			'heapAfterGcDeltaMiB',
		)}`,
	);
	console.log(
		`  Event-loop max ↓ ${markInconclusive(
			describeRelativeChange(candidate.eventLoopMaxMilliseconds, baseline.eventLoopMaxMilliseconds),
			candidate,
			baseline,
			'eventLoopMaxMilliseconds',
		)}`,
	);
	console.log(
		`  Cleanup wait ↓   ${markInconclusive(
			describeCleanupChange(candidate.cleanupMilliseconds, baseline.cleanupMilliseconds),
			candidate,
			baseline,
			'cleanupMilliseconds',
		)}`,
	);
}

function printRetainedState(summary) {
	console.log('\nRetained state after the workload:');
	console.table(
		arms.map(arm => {
			const retained = summary[arm.id].retained;
			return {
				Adapter: arm.label,
				Entries: retained.entries,
				Buckets: retained.buckets,
				'Logical relationships': retained.relationshipIds,
				Indexes: retained.indexes,
				Schedules: retained.schedules,
			};
		}),
	);
}

function runIsolated(arm, scenario, repetition) {
	process.stderr.write(`${scenario.label}: ${arm.label}, sample ${repetition}\n`);
	const child = spawnSync(
		process.execPath,
		['--expose-gc', fileURLToPath(import.meta.url), 'child', arm.id, scenario.id],
		{
			cwd: repository,
			encoding: 'utf8',
			env: {
				...process.env,
				SEYFERT_CACHE_BENCH_BASELINE: baselineSha,
				SEYFERT_CACHE_BENCH_VERIFY_RELATIONSHIPS: repetition === 1 ? '1' : '0',
			},
			maxBuffer: 10 * 1024 * 1024,
		},
	);
	if (child.status !== 0) {
		throw new Error(`${arm.label}, ${scenario.label}, run ${repetition} failed:\n${child.stderr || child.stdout}`);
	}
	return { repetition, ...JSON.parse(child.stdout) };
}

function balancedArms(repetition) {
	const offset = repetition - 1;
	return arms.map((_, index) => arms[(index + offset) % arms.length]);
}

function measuredMillisecondsFor(runs, scenarioId, armId) {
	return runs
		.filter(run => run.scenario === scenarioId && run.arm === armId)
		.reduce((total, run) => total + run.operationMilliseconds, 0);
}

function hasEnoughMeasuredTime(runs, scenarioId) {
	return arms.every(arm => measuredMillisecondsFor(runs, scenarioId, arm.id) >= minimumMeasuredMilliseconds);
}

function printSampleSummary(summary) {
	const repetitions = summary[arms[0].id].repetitions;
	console.log(`Samples: ${repetitions} isolated runs per adapter`);
	console.log(
		`Measured workload: ${arms
			.map(arm => `${arm.label} ${formatNumber(summary[arm.id].measuredMilliseconds / 1_000, 3)} s`)
			.join('; ')}`,
	);
	const belowTarget = arms.filter(arm => summary[arm.id].measuredMilliseconds < minimumMeasuredMilliseconds);
	if (belowTarget.length) {
		console.log(
			`Signal warning: ${belowTarget.map(arm => arm.label).join(', ')} did not reach the ${formatNumber(
				minimumMeasuredMilliseconds / 1_000,
				1,
			)} s measured-workload target before the sample cap`,
		);
	}
}

async function runCoordinator() {
	const runs = [];
	console.log('Seyfert cache adapter benchmark');
	console.log('===============================');
	console.log(`Runtime:    Node ${process.versions.node}`);
	console.log(`Baseline:   ${baselineRef} (${baselineSha})`);
	console.log('Candidates: MemoryAdapter and LimitedMemoryAdapter from the current working tree');
	console.log(
		`Method:     ${minimumRepetitions}-${maximumRepetitions} isolated samples with warm-up and balanced adapter order`,
	);
	console.log(`Target:     at least ${formatNumber(minimumMeasuredMilliseconds / 1_000)} s cumulative measured workload per adapter`);
	console.log('Integrity:  relationships are checked in one separate untimed run per adapter and scenario');
	console.log('Direction:  ↑ higher is better; ↓ lower is better; retained-state counts are descriptive');
	console.log('Metrics:    values are medians; ± is median absolute deviation as a percentage; loop values are event-loop delays\n');

	for (const scenario of selectedScenarios) {
		for (let repetition = 1; repetition <= maximumRepetitions; repetition++) {
			for (const arm of balancedArms(repetition)) runs.push(runIsolated(arm, scenario, repetition));
			if (repetition >= minimumRepetitions && hasEnoughMeasuredTime(runs, scenario.id)) break;
		}
	}

	for (const scenario of selectedScenarios) {
		const summary = Object.fromEntries(
			arms.map(arm => [
				arm.id,
				summarize(runs.filter(run => run.scenario === scenario.id && run.arm === arm.id)),
			]),
		);
		console.log(`\n${scenario.label}`);
		console.log('-'.repeat(scenario.label.length));
		console.log(scenario.description);
		printSampleSummary(summary);
		console.log();
		printMetricTable(summary);
		for (const comparison of comparisons) printComparison(summary, comparison);
		printRetainedState(summary);
	}
}

if (process.argv[2] === 'child') {
	process.stdout.write(JSON.stringify(await runChild(process.argv[3], process.argv[4])));
} else {
	await runCoordinator();
}
