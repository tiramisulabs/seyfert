const { performance } = require('node:perf_hooks');
const { MemoryAdapter, LimitedMemoryAdapter } = require('../../lib');
const { MergeOptions } = require('../../lib/common');

if (typeof global.gc !== 'function') {
	throw new Error('This benchmark requires --expose-gc.');
}

class OldLimitedCollection {
	static default = {
		resetOnDemand: false,
		limit: Number.POSITIVE_INFINITY,
		expire: 0,
	};

	data = new Map();
	options;
	timeout = undefined;
	_closer = undefined;
	_closerDirty = true;
	_pendingReset = false;

	constructor(options = {}) {
		this.options = MergeOptions(OldLimitedCollection.default, options);
	}

	set(key, value, customExpire = this.options.expire) {
		if (this.options.limit <= 0) {
			return;
		}

		const expireOn = Date.now() + customExpire;
		const entry = customExpire > 0 ? { value, expire: customExpire, expireOn } : { value, expire: -1, expireOn: -1 };
		this.data.set(key, entry);

		if (entry.expire !== -1 && (!this._closer || this._closerDirty || entry.expireOn <= this._closer.expireOn)) {
			this._closer = entry;
			this._closerDirty = false;
		}

		if (this.size > this.options.limit) {
			const iter = this.data.keys();
			while (this.size > this.options.limit) {
				this.delete(iter.next().value);
			}
		}

		if (this.closer?.expireOn === expireOn) {
			this.resetTimeout();
		}
	}

	raw(key) {
		return this.data.get(key);
	}

	get(key) {
		const data = this.data.get(key);
		if (this.options.resetOnDemand && data && data.expire !== -1) {
			const wasCloser = this._closer === data;
			data.expireOn = Date.now() + data.expire;
			if (wasCloser) {
				this._closerDirty = true;
				this.resetTimeout();
			}
		}
		return data?.value;
	}

	has(key) {
		return this.data.has(key);
	}

	delete(key) {
		const value = this.raw(key);
		if (value) {
			const wasCloser = this._closer === value;
			if (wasCloser) {
				this._closerDirty = true;
			}
			this.options.onDelete?.(key, value.value);
			const result = this.data.delete(key);
			if (wasCloser && !this._pendingReset) {
				this._pendingReset = true;
				setImmediate(() => {
					this._pendingReset = false;
					this.resetTimeout();
				});
			}
			return result;
		}

		return this.data.delete(key);
	}

	get closer() {
		if (this._closerDirty) {
			this._closer = undefined;
			for (const value of this.data.values()) {
				if (value.expire === -1) {
					continue;
				}

				if (!this._closer || value.expireOn < this._closer.expireOn) {
					this._closer = value;
				}
			}
			this._closerDirty = false;
		}

		return this._closer;
	}

	get size() {
		return this.data.size;
	}

	resetTimeout() {
		this.stopTimeout();
		this.startTimeout();
	}

	stopTimeout() {
		clearTimeout(this.timeout);
		this.timeout = undefined;
	}

	startTimeout() {
		const { expireOn, expire } = this.closer || { expire: -1, expireOn: -1 };
		if (expire === -1) {
			return;
		}

		if (this.timeout) {
			this.stopTimeout();
		}

		this.timeout = setTimeout(() => {
			this.clearExpired();
			this.resetTimeout();
		}, expireOn - Date.now());
	}

	keys() {
		return this.data.keys();
	}

	values() {
		return this.data.values();
	}

	entries() {
		return this.data.entries();
	}

	clear() {
		this.data.clear();
		this._closer = undefined;
		this._closerDirty = false;
		this.resetTimeout();
	}

	clearExpired() {
		for (const [key, value] of this.data) {
			if (value.expireOn === -1) {
				continue;
			}

			if (Date.now() >= value.expireOn) {
				this.options.onDelete?.(key, value.value);
				this.data.delete(key);
			}
		}
	}
}

class OldLimitedMemoryAdapter {
	isAsync = false;
	storage = new Map();
	relationships = new Map();
	options;

	constructor(options) {
		this.options = MergeOptions(
			{
				default: {
					expire: undefined,
					limit: Number.POSITIVE_INFINITY,
				},
				encode(data) {
					return data;
				},
				decode(data) {
					return data;
				},
			},
			options,
		);
	}

	start() {}

	bulkGet(keys) {
		const result = [];
		for (const key of keys) {
			const data = this.get(key);
			if (data) {
				result.push(data);
			}
		}
		return result;
	}

	get(key) {
		for (const storageEntry of this.storage.values()) {
			if (storageEntry.has(key)) {
				const data = storageEntry.get(key);
				return data ? this.options.decode(data) : null;
			}
		}

		return null;
	}

	__set(key, data) {
		const isArray = Array.isArray(data);
		if (isArray && data.length === 0) {
			return;
		}

		const guildId = isArray ? data[0].guild_id : data.guild_id;
		const namespace = `${key.split('.')[0]}${guildId ? `.${guildId}` : ''}`;
		const self = this;

		if (!this.storage.has(namespace)) {
			this.storage.set(
				namespace,
				new OldLimitedCollection({
					expire: this.options[key.split('.')[0]]?.expire ?? this.options.default.expire,
					limit: this.options[key.split('.')[0]]?.limit ?? this.options.default.limit,
					resetOnDemand: true,
					onDelete(k) {
						const relationshipNamespace = key.split('.')[0];
						const existsRelation = self.relationships.has(relationshipNamespace);
						if (!existsRelation) {
							return;
						}

						switch (relationshipNamespace) {
							case 'ban':
							case 'member':
							case 'voice_state': {
								const split = k.split('.');
								self.removeToRelationship(`${namespace}.${split[1]}`, split[2]);
								break;
							}
							case 'channel':
							case 'emoji':
							case 'presence':
							case 'role':
							case 'stage_instance':
							case 'sticker':
							case 'overwrite':
							case 'message':
								self.removeToRelationship(namespace, k.split('.')[1]);
								break;
							default:
								self.removeToRelationship(namespace, k.split('.')[1]);
								break;
						}
					},
				}),
			);
		}

		this.storage.get(namespace).set(key, this.options.encode(data));
	}

	bulkSet(keys) {
		for (const [key, value] of keys) {
			this.__set(key, value);
		}
	}

	set(key, data) {
		this.__set(key, data);
	}

	bulkPatch(keys) {
		for (const [key, value] of keys) {
			const oldData = this.get(key);
			this.__set(key, Array.isArray(value) ? value : { ...(oldData ?? {}), ...value });
		}
	}

	patch(key, data) {
		const oldData = this.get(key);
		this.__set(key, Array.isArray(data) ? data : { ...(oldData ?? {}), ...data });
	}

	values(to) {
		const array = [];
		for (const key of this.keys(to)) {
			const content = this.get(key);
			if (content) {
				array.push(content);
			}
		}
		return array;
	}

	keys(to) {
		const result = [];
		for (const id of this._getRelationshipSet(to)) {
			result.push(`${to}.${id}`);
		}
		return result;
	}

	count(to) {
		return this._getRelationshipSet(to).size;
	}

	bulkRemove(keys) {
		for (const key of keys) {
			this.remove(key);
		}
	}

	remove(key) {
		const keySplit = key.split('.');
		const parentNamespace = keySplit.at(0);

		switch (parentNamespace) {
			case 'ban':
			case 'member':
			case 'voice_state':
				this.storage.get(`${parentNamespace}.${keySplit.at(1)}`)?.delete(`${parentNamespace}.${keySplit.at(1)}.${keySplit.at(2)}`);
				break;
			case 'channel':
			case 'emoji':
			case 'presence':
			case 'role':
			case 'stage_instance':
			case 'sticker':
			case 'overwrite':
			case 'message':
				for (const keyStorage of this.storage.keys()) {
					if (!keyStorage.startsWith(parentNamespace)) {
						continue;
					}

					const storage = this.storage.get(keyStorage);
					if (storage.has(key)) {
						storage.delete(key);
						break;
					}
				}
				break;
			default:
				this.storage.get(parentNamespace)?.delete(`${parentNamespace}.${keySplit.at(1)}`);
				break;
		}
	}

	flush() {
		this.storage.clear();
		this.relationships.clear();
	}

	contains(to, keys) {
		return this._getRelationshipSet(to).has(keys);
	}

	_getRelationshipSet(to) {
		const key = to.split('.')[0];
		if (!this.relationships.has(key)) {
			this.relationships.set(key, new Map());
		}

		const relation = this.relationships.get(key);
		const subrelationKey = to.split('.')[1] ?? '*';
		if (!relation.has(subrelationKey)) {
			relation.set(subrelationKey, new Set());
		}

		return relation.get(subrelationKey);
	}

	getToRelationship(to) {
		return [...this._getRelationshipSet(to)];
	}

	bulkAddToRelationShip(data) {
		for (const key in data) {
			this.addToRelationship(key, data[key]);
		}
	}

	addToRelationship(to, keys) {
		const data = this._getRelationshipSet(to);
		for (const key of Array.isArray(keys) ? keys : [keys]) {
			data.add(key);
		}
	}

	removeToRelationship(to, keys) {
		const data = this._getRelationshipSet(to);
		for (const key of Array.isArray(keys) ? keys : [keys]) {
			data.delete(key);
		}
	}

	removeRelationship(to) {
		for (const key of Array.isArray(to) ? to : [to]) {
			this.relationships.delete(key);
		}
	}
}

class FullIndexLimitedMemoryAdapter extends LimitedMemoryAdapter {
	_supportsNamespaceIndex() {
		return true;
	}
}

function runGC() {
	global.gc();
	global.gc();
}

function heapMB() {
	return process.memoryUsage().heapUsed / 1024 / 1024;
}

function getStructure(adapter) {
	if (adapter instanceof MemoryAdapter) {
		return {
			stored: adapter.storage.size,
			buckets: 1,
			indexEntries: 0,
		};
	}

	let stored = 0;
	for (const bucket of adapter.storage.values()) {
		stored += bucket.size;
	}

	return {
		stored,
		buckets: adapter.storage.size,
		indexEntries: adapter.keyToNamespace?.size ?? adapter.keyToStorage?.size ?? 0,
	};
}

function sampleKeys(keys, count) {
	const result = new Array(count);
	for (let i = 0; i < count; i++) {
		result[i] = keys[(i * 17) % keys.length];
	}
	return result;
}

function usersScenario() {
	const count = 50_000;
	const pairs = new Array(count);
	const keys = new Array(count);

	for (let i = 0; i < count; i++) {
		const id = `user-${i}`;
		const key = `user.${id}`;
		keys[i] = key;
		pairs[i] = [key, { id, username: `user${i}` }];
	}

	return {
		name: 'users-50k',
		pairs,
		getKeys: sampleKeys(keys, 100_000),
		bulkKeys: sampleKeys(keys, 10_000),
		removeKeys: keys.slice(0, 10_000),
	};
}

function membersScenario() {
	const guilds = 200;
	const perGuild = 500;
	const total = guilds * perGuild;
	const pairs = new Array(total);
	const keys = new Array(total);
	let index = 0;

	for (let guild = 0; guild < guilds; guild++) {
		const guildId = `guild-${guild}`;
		for (let user = 0; user < perGuild; user++) {
			const userId = `user-${guild}-${user}`;
			const key = `member.${guildId}.${userId}`;
			keys[index] = key;
			pairs[index] = [key, { id: userId, guild_id: guildId, nick: `nick-${user}` }];
			index++;
		}
	}

	return {
		name: 'members-100k-200g',
		pairs,
		getKeys: sampleKeys(keys, 100_000),
		bulkKeys: sampleKeys(keys, 10_000),
		removeKeys: keys.slice(0, 10_000),
		options: { member: { limit: Number.POSITIVE_INFINITY } },
	};
}

function channelsScenario() {
	const guilds = 200;
	const perGuild = 200;
	const total = guilds * perGuild;
	const pairs = new Array(total);
	const keys = new Array(total);
	let index = 0;

	for (let guild = 0; guild < guilds; guild++) {
		const guildId = `guild-${guild}`;
		for (let channel = 0; channel < perGuild; channel++) {
			const channelId = `channel-${guild}-${channel}`;
			const key = `channel.${channelId}`;
			keys[index] = key;
			pairs[index] = [key, { id: channelId, guild_id: guildId, type: 0 }];
			index++;
		}
	}

	return {
		name: 'channels-40k-200g',
		pairs,
		getKeys: sampleKeys(keys, 100_000),
		bulkKeys: sampleKeys(keys, 10_000),
		removeKeys: keys.slice(0, 10_000),
		options: { channel: { limit: Number.POSITIVE_INFINITY } },
	};
}

function messagesScenario() {
	const guilds = 100;
	const channelsPerGuild = 10;
	const messagesPerChannel = 100;
	const total = guilds * channelsPerGuild * messagesPerChannel;
	const pairs = new Array(total);
	const keys = new Array(total);
	let index = 0;

	for (let guild = 0; guild < guilds; guild++) {
		const guildId = `guild-${guild}`;
		for (let channel = 0; channel < channelsPerGuild; channel++) {
			const channelId = `channel-${guild}-${channel}`;
			for (let message = 0; message < messagesPerChannel; message++) {
				const messageId = `message-${guild}-${channel}-${message}`;
				const key = `message.${messageId}`;
				keys[index] = key;
				pairs[index] = [key, { id: messageId, guild_id: guildId, channel_id: channelId, content: `msg-${message}` }];
				index++;
			}
		}
	}

	return {
		name: 'messages-100k-100g-1kch',
		pairs,
		getKeys: sampleKeys(keys, 100_000),
		bulkKeys: sampleKeys(keys, 10_000),
		removeKeys: keys.slice(0, 10_000),
		options: { message: { limit: Number.POSITIVE_INFINITY } },
	};
}

function messageLimitScenario() {
	const guilds = 100;
	const channelsPerGuild = 10;
	const messagesPerChannel = 100;
	const total = guilds * channelsPerGuild * messagesPerChannel;
	const pairs = new Array(total);
	let index = 0;

	for (let guild = 0; guild < guilds; guild++) {
		const guildId = `guild-${guild}`;
		for (let channel = 0; channel < channelsPerGuild; channel++) {
			const channelId = `channel-${guild}-${channel}`;
			for (let message = 0; message < messagesPerChannel; message++) {
				const messageId = `message-${guild}-${channel}-${message}`;
				pairs[index] = [`message.${messageId}`, { id: messageId, guild_id: guildId, channel_id: channelId, content: `msg-${message}` }];
				index++;
			}
		}
	}

	return {
		name: 'messages-limit-200',
		pairs,
		options: { message: { limit: 200 } },
	};
}

const factories = {
	Memory: () => new MemoryAdapter(),
	'Limited old': options => new OldLimitedMemoryAdapter(options),
	'Limited full-index': options => new FullIndexLimitedMemoryAdapter(options),
	'Limited hybrid current': options => new LimitedMemoryAdapter(options),
};

function benchScenario(scenario) {
	const results = {};

	for (const [label, create] of Object.entries(factories)) {
		runGC();
		const baseline = heapMB();
		const adapter = create({ default: { limit: Number.POSITIVE_INFINITY }, ...(scenario.options ?? {}) });

		const setupStart = performance.now();
		adapter.bulkSet(scenario.pairs);
		const setupMs = performance.now() - setupStart;

		runGC();
		const retainedHeapMB = heapMB() - baseline;
		const structure = getStructure(adapter);

		const getStart = performance.now();
		for (const key of scenario.getKeys) {
			adapter.get(key);
		}
		const readGetMs = performance.now() - getStart;

		const bulkStart = performance.now();
		adapter.bulkGet(scenario.bulkKeys);
		const readBulkMs = performance.now() - bulkStart;

		const removeStart = performance.now();
		adapter.bulkRemove(scenario.removeKeys);
		const removeMs = performance.now() - removeStart;

		results[label] = {
			setupMs: +setupMs.toFixed(2),
			readGetMs: +readGetMs.toFixed(2),
			readBulkMs: +readBulkMs.toFixed(2),
			removeMs: +removeMs.toFixed(2),
			heapMB: +retainedHeapMB.toFixed(2),
			...structure,
		};

		adapter.flush?.();
	}

	return results;
}

function benchLimitScenario(scenario) {
	const results = {};

	for (const [label, create] of Object.entries(factories)) {
		runGC();
		const baseline = heapMB();
		const adapter = create({ default: { limit: Number.POSITIVE_INFINITY }, ...(scenario.options ?? {}) });

		const setupStart = performance.now();
		adapter.bulkSet(scenario.pairs);
		const setupMs = performance.now() - setupStart;

		runGC();
		results[label] = {
			setupMs: +setupMs.toFixed(2),
			heapMB: +(heapMB() - baseline).toFixed(2),
			...getStructure(adapter),
		};

		adapter.flush?.();
	}

	return results;
}

const users = usersScenario();
const members = membersScenario();
const channels = channelsScenario();
const messages = messagesScenario();
const limit = messageLimitScenario();

console.log(
	JSON.stringify(
		{
			scenarios: {
				[users.name]: benchScenario(users),
				[members.name]: benchScenario(members),
				[channels.name]: benchScenario(channels),
				[messages.name]: benchScenario(messages),
			},
			limitScenario: benchLimitScenario(limit),
		},
		null,
		2,
	),
);
