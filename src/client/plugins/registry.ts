import type { MiddlewareContext } from '../../commands';
import type { HandleableCommand } from '../../commands/handler';
import type { Awaitable } from '../../common/types/util';
import { GatewayIntentBits } from '../../types';
import type { BaseClient, BaseClientOptions } from '../base';
import { createPluginApi } from './api';
import { createPluginConflictError, wrapPluginError } from './errors';
import {
	nextPluginContributionSequence,
	orderedPluginContributions,
	type PluginOrderedContribution,
	type PluginOrderSequence,
} from './order';
import type {
	AnySeyfertPlugin,
	HandleableComponent,
	HandleableModal,
	PluginAutocompleteWrapper,
	PluginCacheResourceConstructor,
	PluginCommandObserver,
	PluginContextInteraction,
	PluginDiagnosticCode,
	PluginDiagnosticMessage,
	PluginDiagnosticSeverity,
	PluginDiagnostics,
	PluginEventErrorHandler,
	PluginGatewayPayloadWrapper,
	PluginIntentResolvable,
	PluginLifecycleStatus,
	PluginOrderOpt,
	PluginRequirement,
	PluginRequirementDiagnostic,
	PluginRequirementInput,
	PluginRestObserver,
	ResolvedPluginList,
	SeyfertPluginOptions,
} from './types';

export interface PluginRuntimeRecord {
	plugin: AnySeyfertPlugin;
	identity: string;
	index: number;
	imports: readonly AnySeyfertPlugin[];
	clientKeys: readonly string[];
	ctxKeys: readonly string[];
	optionFragments: PluginOptionContribution[];
	status: PluginLifecycleStatus;
}

export type PluginEventContributionScope = 'register' | 'setup';

export interface PluginCommandContribution {
	record: PluginRuntimeRecord;
	commands: readonly HandleableCommand[];
	scope: PluginEventContributionScope;
	override: boolean;
	guilds?: readonly string[];
	sequence: number;
}

export interface PluginCommandRemovalContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	names: readonly string[];
	scope: PluginEventContributionScope;
}

export interface PluginComponentContribution {
	record: PluginRuntimeRecord;
	components: readonly HandleableComponent[];
	scope: PluginEventContributionScope;
	override: boolean;
	sequence: number;
}

export interface PluginComponentRemovalContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	customIds: readonly string[];
	scope: PluginEventContributionScope;
}

export interface PluginModalContribution {
	record: PluginRuntimeRecord;
	modals: readonly HandleableModal[];
	scope: PluginEventContributionScope;
	override: boolean;
	sequence: number;
}

export interface PluginModalRemovalContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	customIds: readonly string[];
	scope: PluginEventContributionScope;
}

export interface PluginEventContribution {
	record: PluginRuntimeRecord;
	name: string;
	handler: (...args: unknown[]) => unknown;
	scope: PluginEventContributionScope;
	active: boolean;
	order?: PluginOrderOpt;
	sequence: number;
	once?: boolean;
	fired?: boolean;
}

export interface PluginAnyEventContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	handler: (name: string, ...args: unknown[]) => unknown;
	scope: PluginEventContributionScope;
	active: boolean;
}

export interface PluginEventErrorContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	handler: PluginEventErrorHandler;
	scope: PluginEventContributionScope;
	active: boolean;
}

export interface PluginMiddlewareContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	name: string;
	middleware: MiddlewareContext;
	global: boolean;
	override: boolean;
	scope: PluginEventContributionScope;
}

export interface PluginMiddlewareRemovalContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	names: readonly string[];
	scope: PluginEventContributionScope;
}

export interface PluginGlobalMiddlewareContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	name: string;
}

export interface PluginInstalledMiddleware {
	middleware: MiddlewareContext;
	owner: PluginRuntimeRecord;
}

export interface PluginOptionContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	fragment: SeyfertPluginOptions;
	scope: PluginEventContributionScope;
}

export interface PluginGlobalMiddlewareOptionSources {
	defaults: BaseClientOptions;
	pluginOptions: PluginOptionContribution[];
	userOptions: SeyfertPluginOptions;
}

export interface PluginSharedContribution {
	record: PluginRuntimeRecord;
	factory: (client: BaseClient) => unknown;
	dispose?: (value: unknown) => Awaitable<void>;
	scope: PluginEventContributionScope;
}

export interface PluginLangContribution {
	record: PluginRuntimeRecord;
	locale: string;
	prefix: string;
	values: Record<string, unknown>;
	scope: PluginEventContributionScope;
	sequence: number;
}

export interface PluginGatewayIntentContribution {
	record: PluginRuntimeRecord;
	intents: readonly number[];
}

export interface PluginAutocompleteWrapperContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	wrapper: PluginAutocompleteWrapper;
}

export interface PluginGatewayPayloadWrapperContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	wrapper: PluginGatewayPayloadWrapper;
}

export interface PluginRestObserverContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	observer: PluginRestObserver;
	scope: PluginEventContributionScope;
	active: boolean;
}

export interface PluginHookContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	name: string;
	handler: (...args: unknown[]) => Awaitable<unknown>;
	scope: PluginEventContributionScope;
	active: boolean;
}

export interface PluginCacheResourceContribution {
	record: PluginRuntimeRecord;
	name: string;
	resource: PluginCacheResourceConstructor;
	scope: PluginEventContributionScope;
	onPacket?: (
		event: import('../../types').GatewayDispatchPayload,
		cache: import('../../cache').Cache,
	) => Awaitable<void>;
	sequence: number;
}

export interface PluginCommandObserverContribution extends PluginOrderedContribution {
	record: PluginRuntimeRecord;
	observer: PluginCommandObserver;
	scope: PluginEventContributionScope;
	active: boolean;
}

export interface PluginRequirementContribution extends PluginRequirementDiagnostic {
	record: PluginRuntimeRecord;
}

export interface PluginRuntimeRegistry extends PluginOrderSequence {
	plugins: ResolvedPluginList;
	records: readonly PluginRuntimeRecord[];
	commands: PluginCommandContribution[];
	commandRemovals: PluginCommandRemovalContribution[];
	components: PluginComponentContribution[];
	componentRemovals: PluginComponentRemovalContribution[];
	modals: PluginModalContribution[];
	modalRemovals: PluginModalRemovalContribution[];
	events: PluginEventContribution[];
	anyEvents: PluginAnyEventContribution[];
	eventErrors: PluginEventErrorContribution[];
	middlewares: PluginMiddlewareContribution[];
	middlewareRemovals: PluginMiddlewareRemovalContribution[];
	globalMiddlewares: PluginGlobalMiddlewareContribution[];
	globalMiddlewareOptions?: PluginGlobalMiddlewareOptionSources;
	installedMiddlewares: Map<string, PluginInstalledMiddleware>;
	contributionMutationDiagnostics: Set<string>;
	autocompleteWrappers: PluginAutocompleteWrapperContribution[];
	gatewayIntents: PluginGatewayIntentContribution[];
	gatewayPayloadWrappers: PluginGatewayPayloadWrapperContribution[];
	restObservers: PluginRestObserverContribution[];
	hooks: PluginHookContribution[];
	cacheResources: PluginCacheResourceContribution[];
	commandObservers: PluginCommandObserverContribution[];
	shared: Map<string, PluginSharedContribution>;
	sharedOwners: Map<string, PluginRuntimeRecord>;
	langs: PluginLangContribution[];
	diagnostics: PluginDiagnosticMessage[];
	requirements: PluginRequirementContribution[];
	client?: BaseClient;
}

export function createPluginRuntimeRegistry(plugins: readonly AnySeyfertPlugin[] = []): PluginRuntimeRegistry {
	const ordered = resolvePluginOrder(plugins);
	const records = ordered.map<PluginRuntimeRecord>((plugin, index) => ({
		plugin,
		identity: pluginIdentity(plugin),
		index,
		imports: plugin.imports ?? [],
		clientKeys: Object.keys(plugin.client ?? {}),
		ctxKeys: Object.keys(plugin.ctx ?? {}),
		optionFragments: [],
		status: 'registered',
	}));
	assertUniqueStaticKeys(records, 'clientKeys', 'client');
	assertUniqueStaticKeys(records, 'ctxKeys', 'ctx');

	const resolved = ordered.slice() as unknown as ResolvedPluginList;
	const registry: PluginRuntimeRegistry = {
		plugins: resolved,
		records,
		commands: [],
		components: [],
		modals: [],
		events: [],
		anyEvents: [],
		eventErrors: [],
		middlewares: [],
		globalMiddlewares: [],
		installedMiddlewares: new Map(),
		contributionMutationDiagnostics: new Set(),
		autocompleteWrappers: [],
		gatewayIntents: [],
		gatewayPayloadWrappers: [],
		restObservers: [],
		hooks: [],
		cacheResources: [],
		shared: new Map(),
		sharedOwners: new Map(),
		langs: [],
		diagnostics: [],
		requirements: [],
		nextContributionSequence: 0,
		commandRemovals: [],
		componentRemovals: [],
		modalRemovals: [],
		middlewareRemovals: [],
		commandObservers: [],
	};
	addStaticKeyMultiInstanceDiagnostics(registry);
	validatePluginRequirements(registry, 'plugin');

	Object.defineProperties(resolved, {
		resolved: {
			value: ordered,
		},
		diagnostics: {
			get: () => createPluginDiagnostics(registry),
		},
	});

	return registry;
}

export function runPluginRegister(record: PluginRuntimeRecord, registry: PluginRuntimeRegistry) {
	try {
		const result = record.plugin.register?.(createPluginApi(record, registry));
		if (isPromiseLike(result)) {
			throw createPluginConflictError(
				record.plugin.name,
				'register',
				record.index,
				'register(api) must be synchronous.',
				record.plugin.instanceId,
			);
		}
	} catch (error) {
		throw wrapPluginError(record.plugin.name, 'register', record.index, error, undefined, record.plugin.instanceId);
	}
}

export function bindPluginClient(registry: PluginRuntimeRegistry, client: BaseClient) {
	registry.client = client;
}

export function removePluginEventContribution(registry: PluginRuntimeRegistry, contribution: PluginEventContribution) {
	removeContribution(registry.events, contribution);
}

export function removePluginAnyEventContribution(
	registry: PluginRuntimeRegistry,
	contribution: PluginAnyEventContribution,
) {
	removeContribution(registry.anyEvents, contribution);
}

export function removePluginEventErrorContribution(
	registry: PluginRuntimeRegistry,
	contribution: PluginEventErrorContribution,
) {
	removeContribution(registry.eventErrors, contribution);
}

export function removePluginCommandObserverContribution(
	registry: PluginRuntimeRegistry,
	contribution: PluginCommandObserverContribution,
) {
	removeContribution(registry.commandObservers, contribution);
}

export function removePluginRestObserverContribution(
	registry: PluginRuntimeRegistry,
	contribution: PluginRestObserverContribution,
) {
	removeContribution(registry.restObservers, contribution);
}

export function removePluginHookContribution(registry: PluginRuntimeRegistry, contribution: PluginHookContribution) {
	removeContribution(registry.hooks, contribution);
}

export function activatePluginEventListeners(registry: PluginRuntimeRegistry, record: PluginRuntimeRecord) {
	for (const contribution of eventContributions(registry)) {
		if (contribution.record === record && contribution.scope === 'register') contribution.active = true;
	}
	for (const contribution of registry.commandObservers) {
		if (contribution.record === record && contribution.scope === 'register') contribution.active = true;
	}
	for (const contribution of registry.restObservers) {
		if (contribution.record === record && contribution.scope === 'register') contribution.active = true;
	}
	for (const contribution of registry.hooks) {
		if (contribution.record === record && contribution.scope === 'register') contribution.active = true;
	}
}

export function cleanupPluginEventListeners(registry: PluginRuntimeRegistry, record: PluginRuntimeRecord) {
	cleanupEventContributions(registry.events, record);
	cleanupEventContributions(registry.anyEvents, record);
	cleanupEventContributions(registry.eventErrors, record);
	cleanupCommandObserverContributions(registry.commandObservers, record);
	cleanupRestObserverContributions(registry.restObservers, record);
	cleanupHookContributions(registry.hooks, record);
}

export function cleanupPluginDynamicContributionMutations(
	registry: PluginRuntimeRegistry,
	record: PluginRuntimeRecord,
) {
	cleanupScopedContributions(registry.commands, record);
	cleanupScopedContributions(registry.commandRemovals, record);
	cleanupScopedContributions(registry.components, record);
	cleanupScopedContributions(registry.componentRemovals, record);
	cleanupScopedContributions(registry.modals, record);
	cleanupScopedContributions(registry.modalRemovals, record);
	cleanupScopedContributions(registry.middlewares, record);
	cleanupScopedContributions(registry.middlewareRemovals, record);
	cleanupScopedContributions(registry.langs, record);
	cleanupScopedContributions(registry.cacheResources, record);
	cleanupScopedContributions(record.optionFragments, record);
	if (registry.globalMiddlewareOptions) {
		cleanupScopedContributions(registry.globalMiddlewareOptions.pluginOptions, record);
	}
}

export function hasPluginRequirement(registry: PluginRuntimeRegistry, req: PluginRequirement) {
	if (req.startsWith('plugin:')) {
		const identity = req.slice('plugin:'.length);
		return registry.records.some(record => record.identity === identity);
	}
	return false;
}

export function pluginIdentity(plugin: Pick<AnySeyfertPlugin, 'name' | 'instanceId'>) {
	return plugin.instanceId ? `${plugin.name}#${plugin.instanceId}` : plugin.name;
}

export function resolvePluginIntents(registry: PluginRuntimeRegistry, base: number) {
	return registry.gatewayIntents.reduce(
		(intents, contribution) => contribution.intents.reduce((current, intent) => current | intent, intents),
		base,
	);
}

export function addPluginGlobalMiddlewares(
	registry: PluginRuntimeRegistry,
	record: PluginRuntimeRecord,
	names: readonly string[],
) {
	for (const name of names) {
		registry.globalMiddlewares.push({
			record,
			name,
			sequence: registry.nextContributionSequence++,
		});
	}
}

export function addPluginOptionFragment(
	registry: PluginRuntimeRegistry,
	record: PluginRuntimeRecord,
	fragment: SeyfertPluginOptions,
	scope: PluginEventContributionScope,
) {
	const contribution = {
		record,
		fragment,
		sequence: nextPluginContributionSequence(registry),
		scope,
	};
	record.optionFragments.push(contribution);
	registry.globalMiddlewareOptions?.pluginOptions.push(contribution);
}

export function addPluginDiagnostic(
	registry: PluginRuntimeRegistry,
	record: PluginRuntimeRecord,
	diagnostic: {
		message: string;
		phase: string;
		severity: PluginDiagnosticSeverity;
		code?: PluginDiagnosticCode;
		data?: Record<string, unknown>;
	},
) {
	registry.diagnostics.push({
		plugin: record.plugin.name,
		instanceId: record.plugin.instanceId,
		index: record.index,
		...diagnostic,
	});
}

export function assertCanMutatePluginContribution(
	_registry: PluginRuntimeRegistry,
	record: PluginRuntimeRecord,
	action: 'override' | 'remove',
	kind: string,
	name: string,
	owner: PluginRuntimeRecord | undefined,
	phase: string,
) {
	if (!owner) {
		throw createPluginConflictError(
			record.plugin.name,
			phase,
			record.index,
			`${capitalize(kind)} "${name}" is already registered outside the plugin registry and cannot be ${action}d by a plugin.`,
			record.plugin.instanceId,
		);
	}
	if (owner === record) return;
	if (declaresPluginRequirement(record, owner)) return;
	throw createPluginConflictError(
		record.plugin.name,
		phase,
		record.index,
		`${capitalize(kind)} "${name}" is owned by plugin "${owner.identity}"; ${action} requires plugin "${owner.identity}".`,
		record.plugin.instanceId,
	);
}

export function recordContributionMutationDiagnostic(
	registry: PluginRuntimeRegistry,
	contribution: PluginOrderedContribution & { record: PluginRuntimeRecord },
	action: 'override' | 'remove',
	kind: string,
	name: string,
	owner: PluginRuntimeRecord | undefined,
	phase: string,
) {
	const key = [
		contribution.sequence,
		action,
		kind,
		name,
		owner?.identity ?? 'external',
		contribution.record.identity,
	].join(':');
	if (registry.contributionMutationDiagnostics.has(key)) return;
	registry.contributionMutationDiagnostics.add(key);
	addPluginDiagnostic(registry, contribution.record, {
		phase,
		severity: 'info',
		code: action === 'override' ? 'contribution-override' : 'contribution-removed',
		message: `Plugin "${contribution.record.plugin.name}" ${action}d ${kind} "${name}".`,
		data: {
			kind,
			name,
			owner: owner?.identity,
		},
	});
}

function addStaticKeyMultiInstanceDiagnostics(registry: PluginRuntimeRegistry) {
	for (const record of registry.records) {
		const instanceId = record.plugin.instanceId;
		if (!instanceId) continue;

		const clientKeys = record.clientKeys.filter(key => !key.includes(instanceId));
		const ctxKeys = record.ctxKeys.filter(key => !key.includes(instanceId));
		const middlewareKeys = Object.keys(record.plugin.middlewares ?? {}).filter(key => !key.includes(instanceId));
		const globalMiddlewares = (record.plugin.globalMiddlewares ?? [])
			.map(String)
			.filter(key => !key.includes(instanceId));
		if (!(clientKeys.length || ctxKeys.length || middlewareKeys.length || globalMiddlewares.length)) continue;

		addPluginDiagnostic(registry, record, {
			phase: 'resolve',
			severity: 'warn',
			code: 'static-keys-multi-instance',
			message: `Plugin "${record.identity}" declares static keys that do not include instanceId "${instanceId}".`,
			data: {
				instanceId,
				clientKeys,
				ctxKeys,
				middlewareKeys,
				globalMiddlewares,
			},
		});
	}
}

export function createPluginContextFragment(
	record: PluginRuntimeRecord,
	registry: PluginRuntimeRegistry,
): SeyfertPluginOptions | undefined {
	const map = record.plugin.ctx;
	if (!map) return undefined;

	return {
		context(interaction: PluginContextInteraction) {
			if (!registry.client) {
				throw createPluginConflictError(
					record.plugin.name,
					'ctx',
					record.index,
					'Plugin context used before client bind.',
					record.plugin.instanceId,
				);
			}
			const context: Record<string, unknown> = {};
			for (const [key, factory] of Object.entries(map)) {
				try {
					context[key] = factory(interaction, registry.client);
				} catch (error) {
					throw wrapPluginError(
						record.plugin.name,
						`ctx.${key}`,
						record.index,
						error,
						undefined,
						record.plugin.instanceId,
					);
				}
			}
			return context;
		},
	};
}

export function installPluginClientMaps(client: BaseClient, registry: PluginRuntimeRegistry) {
	const claimed = new Map<string, PluginRuntimeRecord>();

	for (const record of registry.records) {
		for (const [key, factory] of Object.entries(record.plugin.client ?? {})) {
			if (key in client) {
				throw createPluginConflictError(
					record.plugin.name,
					`client.${key}`,
					record.index,
					`Client key "${key}" is reserved or already exists.`,
					record.plugin.instanceId,
				);
			}
			const owner = claimed.get(key);
			if (owner) {
				throw createPluginConflictError(
					record.plugin.name,
					`client.${key}`,
					record.index,
					`Client key "${key}" is already claimed by plugin "${owner.plugin.name}".`,
					record.plugin.instanceId,
				);
			}
			claimed.set(key, record);
			try {
				Object.defineProperty(client, key, {
					configurable: true,
					enumerable: true,
					value: factory(client),
					writable: false,
				});
			} catch (error) {
				throw wrapPluginError(
					record.plugin.name,
					`client.${key}`,
					record.index,
					error,
					undefined,
					record.plugin.instanceId,
				);
			}
		}
	}
}

export function installPluginMiddlewares(client: BaseClient, registry: PluginRuntimeRegistry) {
	const declared = registry.records.flatMap(record =>
		Object.entries(record.plugin.middlewares ?? {}).map(([name, middleware]) => ({
			record,
			name,
			middleware: middleware as MiddlewareContext,
			global: (record.plugin.globalMiddlewares ?? []).includes(name as never),
			override: false,
			scope: 'register' as const,
			sequence: record.index - registry.records.length,
		})),
	);
	const mutations = orderedPluginContributions([
		...declared.map(contribution => ({ ...contribution, kind: 'add' as const })),
		...registry.middlewares.map(contribution => ({ ...contribution, kind: 'add' as const })),
		...registry.middlewareRemovals.map(contribution => ({ ...contribution, kind: 'remove' as const })),
	]);
	if (!mutations.length && !registry.installedMiddlewares.size) return;
	const middlewares = new Map<string, { middleware: MiddlewareContext; owner?: PluginRuntimeRecord }>();
	for (const [name, middleware] of Object.entries(client.middlewares ?? {})) {
		const installed = registry.installedMiddlewares.get(name);
		if (installed?.middleware === middleware) continue;
		middlewares.set(name, { middleware });
	}

	for (const contribution of mutations) {
		if (contribution.kind === 'remove') {
			for (const name of contribution.names) {
				const existing = middlewares.get(name);
				if (!existing) continue;
				assertCanMutatePluginContribution(
					registry,
					contribution.record,
					'remove',
					'middleware',
					name,
					existing.owner,
					`middlewares.${name}`,
				);
				middlewares.delete(name);
				recordMiddlewareMutationDiagnostic(
					registry,
					contribution,
					'remove',
					name,
					existing.owner,
					`middlewares.${name}`,
				);
			}
			continue;
		}
		const existing = middlewares.get(contribution.name);
		if (existing && !contribution.override) {
			throw createPluginConflictError(
				contribution.record.plugin.name,
				`middlewares.${contribution.name}`,
				contribution.record.index,
				`Middleware "${contribution.name}" is already registered.`,
				contribution.record.plugin.instanceId,
			);
		}
		if (existing) {
			assertCanMutatePluginContribution(
				registry,
				contribution.record,
				'override',
				'middleware',
				contribution.name,
				existing.owner,
				`middlewares.${contribution.name}`,
			);
			recordMiddlewareMutationDiagnostic(
				registry,
				contribution,
				'override',
				contribution.name,
				existing.owner,
				`middlewares.${contribution.name}`,
			);
		}
		middlewares.set(contribution.name, { middleware: contribution.middleware, owner: contribution.record });
	}

	registry.installedMiddlewares = new Map(
		[...middlewares]
			.filter((entry): entry is [string, PluginInstalledMiddleware] => !!entry[1].owner)
			.map(([name, contribution]) => [name, { middleware: contribution.middleware, owner: contribution.owner }]),
	);
	client.middlewares = Object.fromEntries(
		[...middlewares].map(([name, contribution]) => [name, contribution.middleware]),
	);
}

function recordMiddlewareMutationDiagnostic(
	registry: PluginRuntimeRegistry,
	contribution: PluginMiddlewareContribution | PluginMiddlewareRemovalContribution,
	action: 'override' | 'remove',
	name: string,
	owner: PluginRuntimeRecord | undefined,
	phase: string,
) {
	recordContributionMutationDiagnostic(registry, contribution, action, 'middleware', name, owner, phase);
}

function resolvePluginOrder(plugins: readonly AnySeyfertPlugin[]) {
	const ordered: AnySeyfertPlugin[] = [];
	const seen = new Set<AnySeyfertPlugin>();
	const visiting = new Set<AnySeyfertPlugin>();
	const identities = new Map<string, AnySeyfertPlugin>();

	const visit = (plugin: AnySeyfertPlugin, chain: readonly string[], index: number) => {
		if (!plugin.name) {
			throw createPluginConflictError('<anonymous>', 'resolve', index, 'Seyfert plugins must have a name.');
		}
		const identity = pluginIdentity(plugin);
		const existing = identities.get(identity);
		if (existing && existing !== plugin) {
			const duplicateMessage = plugin.instanceId
				? `Duplicate plugin identity "${identity}".`
				: `Duplicate plugin name "${plugin.name}". Use instanceId to register multiple instances of the same plugin.`;
			throw createPluginConflictError(plugin.name, 'resolve', ordered.length, duplicateMessage, plugin.instanceId);
		}
		identities.set(identity, plugin);
		if (seen.has(plugin)) return;
		if (visiting.has(plugin)) {
			throw createPluginConflictError(
				plugin.name,
				'resolve',
				ordered.length,
				`Circular plugin import detected: ${[...chain, identity].join(' -> ')}.`,
				plugin.instanceId,
			);
		}

		visiting.add(plugin);
		for (const imported of plugin.imports ?? []) visit(imported, [...chain, identity], ordered.length);
		visiting.delete(plugin);
		seen.add(plugin);
		ordered.push(plugin);
	};

	for (const [index, plugin] of plugins.entries()) visit(plugin, [], index);

	return ordered;
}

function assertUniqueStaticKeys(
	records: readonly PluginRuntimeRecord[],
	key: 'clientKeys' | 'ctxKeys',
	phase: 'client' | 'ctx',
) {
	const owners = new Map<string, PluginRuntimeRecord>();
	for (const record of records) {
		for (const value of record[key]) {
			const owner = owners.get(value);
			if (owner) {
				throw createPluginConflictError(
					record.plugin.name,
					`${phase}.${value}`,
					record.index,
					`${phase} key "${value}" is already claimed by plugin "${owner.plugin.name}".`,
					record.plugin.instanceId,
				);
			}
			owners.set(value, record);
		}
	}
}

function createPluginDiagnostics(registry: PluginRuntimeRegistry): readonly PluginDiagnostics[] {
	return registry.records.map(record => ({
		name: record.plugin.name,
		instanceId: record.plugin.instanceId,
		index: record.index,
		status: record.status,
		imports: record.imports.map(pluginIdentity),
		clientKeys: record.clientKeys,
		ctxKeys: record.ctxKeys,
		commands: registry.commands.filter(contribution => contribution.record === record).flatMap(c => c.commands).length,
		components: registry.components.filter(contribution => contribution.record === record).flatMap(c => c.components)
			.length,
		modals: registry.modals.filter(contribution => contribution.record === record).flatMap(c => c.modals).length,
		events: registry.events
			.filter(contribution => contribution.record === record)
			.map(contribution => contribution.name),
		middlewares: registry.middlewares
			.filter(contribution => contribution.record === record)
			.map(contribution => contribution.name)
			.concat(Object.keys(record.plugin.middlewares ?? {})),
		autocompleteWrappers: registry.autocompleteWrappers.filter(contribution => contribution.record === record).length,
		gatewayPayloadWrappers: registry.gatewayPayloadWrappers.filter(contribution => contribution.record === record)
			.length,
		requirements: registry.requirements
			.filter(contribution => contribution.record === record)
			.map(({ kind, req, range, resolvedVersion, optional, satisfied }) => ({
				kind,
				req,
				range,
				resolvedVersion,
				optional,
				satisfied,
			})),
		shared: [...registry.shared.entries()]
			.filter(([, contribution]) => contribution.record === record)
			.map(([name]) => name),
		messages: registry.diagnostics.filter(message => message.index === record.index),
	}));
}

export function resolveGatewayIntent(intent: PluginIntentResolvable): number {
	return typeof intent === 'string' ? GatewayIntentBits[intent] : intent;
}

export function unknownGatewayIntentBits(intent: PluginIntentResolvable): number {
	if (typeof intent !== 'number') return 0;
	return intent & ~knownGatewayIntentMask;
}

function normalizeRequirement(input: PluginRequirementInput): PluginRequirementDiagnostic {
	if (typeof input === 'string') return { kind: 'plugin', req: input, optional: false, satisfied: false };
	if ('capability' in input) {
		return {
			kind: 'capability',
			req: input.capability.name,
			optional: input.optional === true,
			satisfied: false,
		};
	}
	return {
		kind: 'plugin',
		req: input.req,
		range: input.range,
		optional: input.optional === true,
		satisfied: false,
	};
}

export function validatePluginRequirements(
	registry: PluginRuntimeRegistry,
	kind: 'plugin' | 'capability' | 'all' = 'all',
) {
	for (const record of registry.records) {
		for (const input of record.plugin.requires ?? []) {
			const requirement = normalizeRequirement(input);
			if (kind !== 'all' && requirement.kind !== kind) continue;
			resolveRequirement(registry, requirement);
			registry.requirements.push({ record, ...requirement });
			if (requirement.satisfied) continue;
			if (requirement.optional) {
				addPluginDiagnostic(registry, record, {
					phase: 'requires',
					severity: 'warn',
					code: 'missing-optional-requirement',
					message: optionalRequirementMessage(requirement),
					data: requirementDiagnosticData(requirement),
				});
				continue;
			}
			throw createPluginConflictError(
				record.plugin.name,
				'requires',
				record.index,
				requiredRequirementMessage(requirement),
				record.plugin.instanceId,
			);
		}
	}
}

function resolveRequirement(registry: PluginRuntimeRegistry, requirement: PluginRequirementDiagnostic) {
	if (requirement.kind === 'capability') {
		requirement.satisfied = registry.shared.has(requirement.req);
		return;
	}

	if (!String(requirement.req).startsWith('plugin:')) return;
	const identity = String(requirement.req).slice('plugin:'.length);
	const target = registry.records.find(record => record.identity === identity);
	if (!target) return;
	const version = pluginVersion(target.plugin.meta);
	requirement.resolvedVersion = version;
	requirement.satisfied = requirement.range ? !!version && satisfiesSemverRange(version, requirement.range) : true;
}

function optionalRequirementMessage(requirement: PluginRequirementDiagnostic) {
	if (requirement.kind === 'capability') {
		return `Optional capability requirement "${requirement.req}" is not registered.`;
	}
	if (requirement.range && requirement.resolvedVersion) {
		return `Optional plugin requirement "${requirement.req}" does not satisfy range "${requirement.range}" (resolved "${requirement.resolvedVersion}").`;
	}
	if (requirement.range) {
		return `Optional plugin requirement "${requirement.req}" is missing version range "${requirement.range}".`;
	}
	return `Optional plugin requirement "${requirement.req}" is not registered.`;
}

function requiredRequirementMessage(requirement: PluginRequirementDiagnostic) {
	if (requirement.kind === 'capability') {
		return `Capability requirement "${requirement.req}" is not registered.`;
	}
	if (requirement.range && requirement.resolvedVersion) {
		return `Plugin requirement "${requirement.req}" does not satisfy range "${requirement.range}" (resolved "${requirement.resolvedVersion}").`;
	}
	if (requirement.range) {
		return `Plugin requirement "${requirement.req}" is missing version range "${requirement.range}".`;
	}
	return `Plugin requirement "${requirement.req}" is not registered.`;
}

function requirementDiagnosticData(requirement: PluginRequirementDiagnostic): Record<string, unknown> {
	if (requirement.kind === 'capability') return { kind: requirement.kind, capability: requirement.req };
	return {
		kind: requirement.kind,
		req: requirement.req,
		range: requirement.range,
		resolvedVersion: requirement.resolvedVersion,
	};
}

function pluginVersion(meta: unknown) {
	if (!meta || typeof meta !== 'object' || !('version' in meta)) return undefined;
	const version = (meta as { version?: unknown }).version;
	return typeof version === 'string' ? version : undefined;
}

function satisfiesSemverRange(version: string, range: string) {
	const parsed = parseSemver(version);
	if (!parsed) return false;
	const trimmed = range.trim();
	if (!trimmed) return true;

	if (trimmed.startsWith('>=')) {
		const minimum = parseSemver(trimmed.slice(2).trim());
		return !!minimum && compareSemver(parsed, minimum) >= 0;
	}
	if (trimmed.startsWith('^')) {
		const minimum = parseSemver(trimmed.slice(1).trim());
		if (!minimum || compareSemver(parsed, minimum) < 0) return false;
		if (minimum.major > 0) return parsed.major === minimum.major;
		if (minimum.minor > 0) return parsed.major === 0 && parsed.minor === minimum.minor;
		return parsed.major === 0 && parsed.minor === 0 && parsed.patch === minimum.patch;
	}
	if (trimmed.startsWith('~')) {
		const minimum = parseSemver(trimmed.slice(1).trim());
		if (!minimum || compareSemver(parsed, minimum) < 0) return false;
		return parsed.major === minimum.major && parsed.minor === minimum.minor;
	}

	const exact = parseSemver(trimmed);
	return !!exact && compareSemver(parsed, exact) === 0;
}

function parseSemver(version: string) {
	const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version.trim());
	if (!match) return undefined;
	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
	};
}

function compareSemver(
	left: { major: number; minor: number; patch: number },
	right: { major: number; minor: number; patch: number },
) {
	return left.major - right.major || left.minor - right.minor || left.patch - right.patch;
}

const knownGatewayIntentMask = Object.values(GatewayIntentBits)
	.filter((value): value is number => typeof value === 'number')
	.reduce((mask, value) => mask | value, 0);

type PluginEventLikeContribution = PluginEventContribution | PluginAnyEventContribution | PluginEventErrorContribution;

function eventContributions(registry: PluginRuntimeRegistry): PluginEventLikeContribution[] {
	return [...registry.events, ...registry.anyEvents, ...registry.eventErrors];
}

function cleanupEventContributions<T extends PluginEventLikeContribution>(
	contributions: T[],
	record: PluginRuntimeRecord,
) {
	for (let index = contributions.length - 1; index >= 0; index--) {
		const contribution = contributions[index]!;
		if (contribution.record !== record) continue;
		if (contribution.scope === 'setup') {
			contributions.splice(index, 1);
			continue;
		}
		contribution.active = false;
	}
}

function cleanupCommandObserverContributions(
	contributions: PluginCommandObserverContribution[],
	record: PluginRuntimeRecord,
) {
	for (let index = contributions.length - 1; index >= 0; index--) {
		const contribution = contributions[index]!;
		if (contribution.record !== record) continue;
		if (contribution.scope === 'setup') {
			contributions.splice(index, 1);
			continue;
		}
		contribution.active = false;
	}
}

function cleanupRestObserverContributions(
	contributions: PluginRestObserverContribution[],
	record: PluginRuntimeRecord,
) {
	for (let index = contributions.length - 1; index >= 0; index--) {
		const contribution = contributions[index]!;
		if (contribution.record !== record) continue;
		if (contribution.scope === 'setup') {
			contributions.splice(index, 1);
			continue;
		}
		contribution.active = false;
	}
}

function cleanupHookContributions(contributions: PluginHookContribution[], record: PluginRuntimeRecord) {
	for (let index = contributions.length - 1; index >= 0; index--) {
		const contribution = contributions[index]!;
		if (contribution.record !== record) continue;
		if (contribution.scope === 'setup') {
			contributions.splice(index, 1);
			continue;
		}
		contribution.active = false;
	}
}

function cleanupScopedContributions<T extends { record: PluginRuntimeRecord; scope: PluginEventContributionScope }>(
	contributions: T[],
	record: PluginRuntimeRecord,
) {
	for (let index = contributions.length - 1; index >= 0; index--) {
		const contribution = contributions[index]!;
		if (contribution.record === record && contribution.scope !== 'register') contributions.splice(index, 1);
	}
}

function removeContribution<T>(contributions: T[], contribution: T) {
	const index = contributions.indexOf(contribution);
	if (index !== -1) contributions.splice(index, 1);
}

function declaresPluginRequirement(record: PluginRuntimeRecord, owner: PluginRuntimeRecord) {
	const requirement = `plugin:${owner.identity}`;
	return (record.plugin.requires ?? []).some(input => {
		if (typeof input === 'string') return input === requirement;
		if ('req' in input) return input.req === requirement;
		return false;
	});
}

function capitalize(value: string) {
	return value[0]?.toUpperCase() + value.slice(1);
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
	return (
		typeof value === 'object' &&
		value !== null &&
		'then' in value &&
		typeof (value as { then?: unknown }).then === 'function'
	);
}
