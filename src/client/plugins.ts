import { MergeOptions } from '../common';
import type { Awaitable } from '../common/types/util';
import type { BaseClient, BaseClientOptions, ContextScope, ContextScopeContext } from './base';
import { createPluginApi } from './plugins/api';
import { SeyfertPluginAggregateError, wrapPluginError } from './plugins/errors';
import {
	nextPluginContributionSequence,
	orderedPluginContributions,
	type PluginOrderedContribution,
} from './plugins/order';
import {
	activatePluginEventListeners,
	addPluginDiagnostic,
	addPluginGlobalMiddlewares,
	bindPluginClient,
	cleanupPluginDynamicContributionMutations,
	cleanupPluginEventListeners,
	createPluginContextFragment,
	createPluginRuntimeRegistry,
	installPluginClientMaps,
	installPluginMiddlewares,
	type PluginDefaultsContribution,
	type PluginOptionContribution,
	type PluginRuntimeRegistry,
	pluginIdentity,
	resolvePluginIntents,
	runPluginRegister,
	validatePluginRequirements,
} from './plugins/registry';
import {
	cleanupPluginDynamicSharedContributions,
	clearSharedRegistryInstances,
	disposePluginSharedValues,
} from './plugins/shared';

export { SeyfertPluginAggregateError, SeyfertPluginError } from './plugins/errors';
export { createSharedKey } from './plugins/shared';
export { PluginOrder } from './plugins/types';

import type {
	AnySeyfertPlugin,
	ExtendOf,
	PluginAutocompleteNext,
	PluginAutocompletePayload,
	PluginClientMap,
	PluginCommandObserver,
	PluginContextMap,
	PluginGatewayPayload,
	PluginHookName,
	PluginHookPayload,
	PluginMiddlewareMap,
	PluginRequirementInput,
	ResolvedPluginList,
	SeyfertCommandDefaults,
	SeyfertComponentDefaults,
	SeyfertModalDefaults,
	SeyfertPlugin,
	SeyfertPluginApi,
	SeyfertPluginClient,
	SeyfertPluginOptions,
} from './plugins/types';

export type {
	AnySeyfertPlugin,
	ContextOf,
	ExtendOf,
	HandleableComponent,
	HandleableModal,
	MiddlewaresOf,
	PluginAutocompleteNext,
	PluginAutocompletePayload,
	PluginAutocompleteWrapper,
	PluginCacheResourceConstructor,
	PluginCacheResourceOptions,
	PluginClientMap,
	PluginCommandContributionOptions,
	PluginCommandObserver,
	PluginCommandObserverCommand,
	PluginCommandObserverContext,
	PluginContextInteraction,
	PluginContextMap,
	PluginContextMapOf,
	PluginContextOf,
	PluginDiagnosticCode,
	PluginDiagnosticMessage,
	PluginDiagnosticSeverity,
	PluginDiagnostics,
	PluginExtensionOf,
	PluginGatewayPayload,
	PluginGatewayPayloadWrapper,
	PluginHandlerConstructor,
	PluginHandlerCreator,
	PluginHandlerInstance,
	PluginHandlerKind,
	PluginHandlerMetadata,
	PluginHandlerOptions,
	PluginHandlerTransformer,
	PluginHookHandler,
	PluginHookName,
	PluginHookPayload,
	PluginHookPayloadFor,
	PluginIntentResolvable,
	PluginLifecycleStatus,
	PluginLoadedMetadata,
	PluginMiddlewareDenialMetadata,
	PluginMiddlewareMap,
	PluginMiddlewaresMapOf,
	PluginMiddlewaresOf,
	PluginOrderOpt,
	PluginRequirement,
	PluginRequirementDiagnostic,
	PluginRequirementInput,
	PluginRestFailPayload,
	PluginRestObserver,
	PluginRestRatelimitPayload,
	PluginRestRequestPayload,
	PluginRestSuccessPayload,
	PluginSharedOptions,
	PluginSharedRegistry,
	PluginUploadCommandsMetadata,
	PluginUsingClient,
	RegisteredPluginContext,
	RegisteredPluginExtension,
	RegisteredPluginMiddlewares,
	RegisteredPluginShared,
	RegisteredPlugins,
	ResolvedPluginList,
	SemverRange,
	SeyfertCommandDefaults,
	SeyfertComponentDefaults,
	SeyfertModalDefaults,
	SeyfertPlugin,
	SeyfertPluginApi,
	SeyfertPluginClient,
	SeyfertPluginHooks,
	SeyfertPluginOptions,
	SeyfertRegistry,
	SharedKey,
	SharedValue,
} from './plugins/types';

type CommandDefaults = SeyfertCommandDefaults;
type ComponentDefaults = SeyfertComponentDefaults;
type ModalDefaults = SeyfertModalDefaults;
type AnyFunction = (...args: unknown[]) => unknown;

type CreatePluginInputBase<
	Name extends string,
	I extends readonly AnySeyfertPlugin[],
	E extends object,
	C extends object,
	M extends PluginMiddlewareMap,
> = {
	readonly name: Name;
	readonly instanceId?: string;
	readonly imports?: I;
	readonly requires?: readonly PluginRequirementInput[];
	readonly client?: PluginClientMap<E, I>;
	readonly ctx?: PluginContextMap<C, I, E>;
	readonly middlewares?: M;
	readonly globalMiddlewares?: readonly (keyof M & string)[];
	options?(current: Readonly<BaseClientOptions>): SeyfertPluginOptions;
	register?(api: SeyfertPluginApi<M, ExtendOf<I> & E>): void;
	setup?(client: SeyfertPluginClient & ExtendOf<I> & E, api?: SeyfertPluginApi<M, ExtendOf<I> & E>): Awaitable<void>;
	teardown?(client: SeyfertPluginClient & ExtendOf<I> & E, api?: SeyfertPluginApi<M, ExtendOf<I> & E>): Awaitable<void>;
};

type CreatePluginReservedKey =
	| keyof CreatePluginInputBase<string, readonly AnySeyfertPlugin[], object, object, PluginMiddlewareMap>
	| 'meta';
type CreatePluginExtra<T extends object> = Omit<T, CreatePluginReservedKey>;

type CreatePluginInputWithMeta<
	Name extends string,
	I extends readonly AnySeyfertPlugin[],
	E extends object,
	C extends object,
	M extends PluginMiddlewareMap,
	Meta,
> = CreatePluginInputBase<Name, I, E, C, M> & { readonly meta: Meta };

type CreatePluginInputWithoutMeta<
	Name extends string,
	I extends readonly AnySeyfertPlugin[],
	E extends object,
	C extends object,
	M extends PluginMiddlewareMap,
> = CreatePluginInputBase<Name, I, E, C, M> & { readonly meta?: never };

type CreatePluginOutputBase<
	Name extends string,
	I extends readonly AnySeyfertPlugin[],
	E extends object,
	C extends object,
	M extends PluginMiddlewareMap,
> = Omit<SeyfertPlugin<E, C, I, M>, 'meta'> & {
	readonly name: Name;
	readonly instanceId?: string;
	readonly imports?: I;
	readonly requires?: readonly PluginRequirementInput[];
	readonly client?: PluginClientMap<E, I>;
	readonly ctx?: PluginContextMap<C, I, E>;
	readonly middlewares?: M;
	readonly globalMiddlewares?: readonly (keyof M & string)[];
};

type CreatePluginOutputWithMeta<
	Name extends string,
	I extends readonly AnySeyfertPlugin[],
	E extends object,
	C extends object,
	M extends PluginMiddlewareMap,
	Meta,
> = CreatePluginOutputBase<Name, I, E, C, M> & { readonly meta: Meta };

export interface ResolvedClientPlugins {
	plugins: ResolvedPluginList;
	options: BaseClientOptions;
	registry: PluginRuntimeRegistry;
}

export function createPlugin<
	const Name extends string,
	const I extends readonly AnySeyfertPlugin[] = readonly [],
	E extends object = {},
	C extends object = {},
	M extends PluginMiddlewareMap = {},
	const Meta = never,
	const Extra extends object = {},
>(
	plugin: CreatePluginInputWithMeta<Name, I, E, C, M, Meta> & Extra,
): CreatePluginOutputWithMeta<Name, I, E, C, M, Meta> & CreatePluginExtra<Extra>;
export function createPlugin<
	const Name extends string,
	const I extends readonly AnySeyfertPlugin[] = readonly [],
	E extends object = {},
	C extends object = {},
	M extends PluginMiddlewareMap = {},
	const Extra extends object = {},
>(
	plugin: CreatePluginInputWithoutMeta<Name, I, E, C, M> & Extra,
): CreatePluginOutputBase<Name, I, E, C, M> & CreatePluginExtra<Extra>;
export function createPlugin(
	plugin: CreatePluginInputBase<string, readonly AnySeyfertPlugin[], object, object, PluginMiddlewareMap> & object,
) {
	return plugin;
}

export function definePlugin<O, P extends AnySeyfertPlugin>(factory: (options: O) => P): (options: O) => P;
export function definePlugin<O extends object, P extends AnySeyfertPlugin>(setup: {
	defaults: O;
	validate?: (options: O) => void;
	factory: (options: O) => P;
}): (options?: Partial<O>) => P;
export function definePlugin<O extends object, P extends AnySeyfertPlugin>(
	setup: ((options: O) => P) | { defaults: O; validate?: (options: O) => void; factory: (options: O) => P },
) {
	if (typeof setup === 'function') return setup;

	return (options?: Partial<O>) => {
		const resolved = { ...setup.defaults, ...options } as O;
		try {
			setup.validate?.(resolved);
			return setup.factory(resolved);
		} catch (error) {
			throw wrapPluginError('<definePlugin>', 'options', -1, error);
		}
	};
}

export function definePlugins<const TPlugins extends readonly AnySeyfertPlugin[]>(plugins: TPlugins): TPlugins;
export function definePlugins<const TPlugins extends readonly AnySeyfertPlugin[]>(...plugins: TPlugins): TPlugins;
export function definePlugins<const TPlugins extends readonly AnySeyfertPlugin[]>(
	...plugins: TPlugins | [TPlugins]
): TPlugins {
	return (Array.isArray(plugins[0]) ? plugins[0] : plugins) as TPlugins;
}

export function createContextScope(scope: ContextScope): ContextScope {
	return scope;
}

const commandHookKeys = [
	'onBeforeMiddlewares',
	'onBeforeOptions',
	'onRunError',
	'onPermissionsFail',
	'onBotPermissionsFail',
	'onInternalError',
	'onMiddlewaresError',
	'onOptionsError',
	'onAfterRun',
] as const satisfies readonly (keyof CommandDefaults)[];

const componentHookKeys = [
	'onBeforeMiddlewares',
	'onRunError',
	'onInternalError',
	'onMiddlewaresError',
	'onAfterRun',
] as const satisfies readonly (keyof ComponentDefaults)[];

const modalHookKeys = [
	'onBeforeMiddlewares',
	'onRunError',
	'onInternalError',
	'onMiddlewaresError',
	'onAfterRun',
] as const satisfies readonly (keyof ModalDefaults)[];

export function resolveClientPlugins(
	defaults: BaseClientOptions,
	options: BaseClientOptions = {},
): ResolvedClientPlugins {
	const registry = createPluginRuntimeRegistry(options.plugins as readonly AnySeyfertPlugin[] | undefined);
	const userOptions = omitPlugins(options);
	const pluginOptionContributions: PluginOptionContribution[] = [];
	const addPluginOption = (record: PluginOptionContribution['record'], fragment: SeyfertPluginOptions) => {
		pluginOptionContributions.push({
			record,
			fragment,
			sequence: nextPluginContributionSequence(registry),
			scope: 'register',
		});
	};
	const pluginOptions = () => pluginOptionContributions.map(contribution => contribution.fragment);

	for (const record of registry.records) {
		const contextFragment = createPluginContextFragment(record, registry);
		if (contextFragment) addPluginOption(record, contextFragment);
		if (record.plugin.globalMiddlewares?.length) {
			const globalMiddlewares = record.plugin.globalMiddlewares as readonly string[];
			addPluginGlobalMiddlewares(registry, record, globalMiddlewares);
			addPluginOption(record, { globalMiddlewares: globalMiddlewares as never });
		}

		const current = MergeOptions<BaseClientOptions>(defaults, ...pluginOptions(), userOptions);
		try {
			const fragment = record.plugin.options?.(current);
			if (fragment) addPluginOption(record, fragment);
		} catch (error) {
			throw wrapPluginError(record.plugin.name, 'options', record.index, error, undefined, record.plugin.instanceId);
		}

		runPluginRegister(record, registry);
		pluginOptionContributions.push(...record.optionFragments);
	}
	validatePluginRequirements(registry, 'capability');

	const optionFragments = pluginOptions();
	const merged = MergeOptions<BaseClientOptions>(defaults, ...optionFragments, userOptions);
	merged.plugins = registry.plugins;
	registry.globalMiddlewareOptions = {
		defaults,
		pluginOptions: pluginOptionContributions,
		userOptions,
	};

	composeContext(merged, defaults, optionFragments, userOptions);
	composeContextScopes(merged, defaults, optionFragments, userOptions);
	composeGlobalMiddlewares(merged, defaults, pluginOptionContributions, userOptions, registry);
	composeDefaults(
		merged.commands?.defaults,
		defaults.commands?.defaults,
		collectPluginDefaultContributions(pluginOptionContributions, registry.pluginDefaults, 'commands'),
		userOptions.commands?.defaults,
		commandHookKeys,
	);
	composeDefaults(
		merged.components?.defaults,
		defaults.components?.defaults,
		collectPluginDefaultContributions(pluginOptionContributions, registry.pluginDefaults, 'components'),
		userOptions.components?.defaults,
		componentHookKeys,
	);
	composeDefaults(
		merged.modals?.defaults,
		defaults.modals?.defaults,
		collectPluginDefaultContributions(pluginOptionContributions, registry.pluginDefaults, 'modals'),
		userOptions.modals?.defaults,
		modalHookKeys,
	);

	return { plugins: registry.plugins, options: merged, registry };
}

export function bindClientPlugins(client: BaseClient, registry: PluginRuntimeRegistry) {
	bindPluginClient(registry, client);
	installPluginClientMaps(client, registry);
	installPluginMiddlewares(client, registry);
}

export function refreshClientPluginGlobalMiddlewares(client: BaseClient, registry: PluginRuntimeRegistry) {
	const sources = registry.globalMiddlewareOptions;
	if (!sources) return;
	composeGlobalMiddlewares(client.options, sources.defaults, sources.pluginOptions, sources.userOptions, registry);
}

export function resolveClientPluginIntents(client: BaseClient, base: number) {
	return resolvePluginIntents(client.pluginRegistry, base);
}

export function runPluginAutocompleteWrappers(
	client: BaseClient,
	payload: PluginAutocompletePayload,
	run: PluginAutocompleteNext,
) {
	const wrappers = client.pluginRegistry.autocompleteWrappers;
	if (!wrappers.length) return run();

	const dispatch = orderedPluginContributions(wrappers).reduceRight<PluginAutocompleteNext>(
		(next, contribution) => () =>
			Promise.resolve(contribution.wrapper(payload, next)).catch(error => {
				throw wrapPluginError(
					contribution.record.plugin.name,
					'autocomplete.wrap',
					contribution.record.index,
					error,
					undefined,
					contribution.record.plugin.instanceId,
				);
			}),
		run,
	);
	return dispatch();
}

export async function runPluginCommandObservers<K extends keyof PluginCommandObserver>(
	client: BaseClient,
	name: K,
	...args: Parameters<NonNullable<PluginCommandObserver[K]>>
) {
	const observers = orderedPluginContributions(client.pluginRegistry.commandObservers).filter(
		contribution => contribution.active,
	);
	for (const contribution of observers) {
		const observer = contribution.observer[name];
		if (!observer) continue;
		try {
			await (observer as (...args: unknown[]) => unknown)(...args);
		} catch (error) {
			client.logger.error(
				`[plugin:${contribution.record.plugin.name}] command observer "${String(name)}" failed`,
				error,
			);
		}
	}
}

export async function runPluginHooks<K extends PluginHookName>(
	client: BaseClient,
	name: K,
	...args: PluginHookPayload<K>
) {
	const hooks = orderedPluginContributions(client.pluginRegistry.hooks).filter(
		contribution => contribution.active && contribution.name === name,
	);
	for (const contribution of hooks) {
		try {
			await (contribution.handler as (...args: unknown[]) => unknown)(...args);
		} catch (error) {
			await reportPluginHookFailure(
				client,
				name,
				wrapPluginError(
					contribution.record.plugin.name,
					`hook:${name}`,
					contribution.record.index,
					error,
					undefined,
					contribution.record.plugin.instanceId,
				),
			);
		}
	}
}

async function reportPluginHookFailure(client: BaseClient, name: string, error: unknown) {
	const observers = orderedPluginContributions(client.pluginRegistry.eventErrors).filter(
		contribution => contribution.active,
	);
	for (const contribution of observers) {
		try {
			await contribution.handler(error, `hook:${name}`);
		} catch (observerError) {
			client.logger.warn('<Client>.hooks.onError', observerError, name);
		}
	}
	client.logger.warn('<Client>.hooks.onFail', error, name);
}

export async function applyPluginGatewayPayloadWrappers(
	client: BaseClient,
	shardId: number,
	payload: PluginGatewayPayload['payload'],
) {
	let current = payload;
	for (const contribution of orderedPluginContributions(client.pluginRegistry.gatewayPayloadWrappers)) {
		let result: Awaited<ReturnType<typeof contribution.wrapper>>;
		try {
			result = await contribution.wrapper({ client, shardId, payload: current });
		} catch (error) {
			throw wrapPluginError(
				contribution.record.plugin.name,
				'gateway.wrapPayload',
				contribution.record.index,
				error,
				undefined,
				contribution.record.plugin.instanceId,
			);
		}
		if (result === null) {
			addPluginDiagnostic(client.pluginRegistry, contribution.record, {
				phase: 'gateway.wrapPayload',
				severity: 'warn',
				code: 'gateway-payload-veto',
				message: `Gateway payload wrapper from plugin "${contribution.record.plugin.name}" vetoed a payload.`,
				data: { shardId, op: current.op },
			});
			return null;
		}
		if (result !== undefined) current = result;
	}
	return current;
}

export async function setupClientPlugins(
	client: BaseClient & { plugins: ResolvedPluginList },
	plugins: ResolvedPluginList,
) {
	const completed: PluginRuntimeRegistry['records'][number][] = [];
	const records = getPluginRecords(client, plugins);

	try {
		for (const record of records) {
			const plugin = record.plugin;
			try {
				record.status = 'setting-up';
				const registry = client.pluginRegistry;
				if (registry) activatePluginEventListeners(registry, record);
				await plugin.setup?.(
					client as never,
					registry ? (createPluginApi(record, registry, 'setup') as never) : undefined,
				);
				record.status = 'ready';
				completed.push(record);
			} catch (error) {
				record.status = 'failed';
				const setupError = wrapPluginError(plugin.name, 'setup', record.index, error, undefined, plugin.instanceId);
				const registry = client.pluginRegistry;
				if (registry) cleanupPluginEventListeners(registry, record);
				const cleanupErrors = registry ? await disposePluginSharedValues(client.shared, registry, record) : [];
				if (registry) cleanupPluginDynamicSharedContributions(registry, record);
				if (registry) cleanupPluginDynamicContributionMutations(registry, record);
				refreshClientPluginContributions(client);
				if (cleanupErrors.length) {
					throw new SeyfertPluginAggregateError(
						'PLUGIN_FAILED',
						'<multiple>',
						'setup',
						-1,
						[setupError, ...cleanupErrors],
						'Seyfert plugin setup failed and cleanup also failed.',
						setupError,
					);
				}
				throw setupError;
			}
		}
	} catch (setupError) {
		try {
			await teardownPluginRecords(client, completed);
		} catch (teardownError) {
			throw new SeyfertPluginAggregateError(
				'PLUGIN_FAILED',
				'<multiple>',
				'setup',
				-1,
				[setupError, teardownError],
				'Seyfert plugin setup failed and cleanup also failed.',
				setupError,
			);
		}
		throw setupError;
	}
}

export async function teardownClientPlugins(
	client: BaseClient & { plugins: ResolvedPluginList },
	plugins: readonly AnySeyfertPlugin[],
) {
	await teardownPluginRecords(client, getPluginRecords(client, plugins));
}

async function teardownPluginRecords(
	client: BaseClient & { plugins: ResolvedPluginList },
	records: readonly PluginRuntimeRegistry['records'][number][],
) {
	const errors: unknown[] = [];

	try {
		for (const record of [...records].reverse()) {
			const plugin = record.plugin;
			let failed = false;
			record.status = 'closing';
			if (client.pluginRegistry) cleanupPluginEventListeners(client.pluginRegistry, record);
			const registry = client.pluginRegistry;

			try {
				await plugin.teardown?.(
					client as never,
					registry ? (createPluginApi(record, registry, 'setup') as never) : undefined,
				);
			} catch (error) {
				failed = true;
				errors.push(
					wrapPluginError(plugin.name, 'teardown', record.index, error, 'PLUGIN_TEARDOWN_FAILED', plugin.instanceId),
				);
			} finally {
				if (registry) cleanupPluginEventListeners(registry, record);
			}

			if (registry) {
				const sharedErrors = await disposePluginSharedValues(client.shared, registry, record);
				if (sharedErrors.length) {
					failed = true;
					errors.push(...sharedErrors);
				}
				cleanupPluginDynamicSharedContributions(registry, record);
				cleanupPluginDynamicContributionMutations(registry, record);
			}

			record.status = failed ? 'failed' : 'closed';
		}
	} finally {
		if (client.shared) clearSharedRegistryInstances(client.shared);
		refreshClientPluginContributions(client);
	}

	if (errors.length) {
		throw new SeyfertPluginAggregateError(
			'PLUGIN_TEARDOWN_FAILED',
			'<multiple>',
			'teardown',
			-1,
			errors,
			'Seyfert plugin teardown failed.',
		);
	}
}

function getPluginRecords(
	client: BaseClient & { pluginRegistry?: PluginRuntimeRegistry },
	plugins: readonly AnySeyfertPlugin[],
) {
	const records = client.pluginRegistry?.records ?? [];
	return plugins.map((plugin, index) => {
		const record = records.find(record => record.plugin === plugin);
		if (record) return record;
		return {
			plugin,
			identity: pluginIdentity(plugin),
			index,
			imports: plugin.imports ?? [],
			clientKeys: Object.keys(plugin.client ?? {}),
			ctxKeys: Object.keys(plugin.ctx ?? {}),
			optionFragments: [],
			status: 'registered' as const,
		};
	});
}

function refreshClientPluginContributions(client: { refreshPluginContributions?: () => void }) {
	client.refreshPluginContributions?.();
}

export function runContextScopes<T>(
	scopes: readonly ContextScope[] | undefined,
	context: ContextScopeContext,
	run: () => Awaitable<T>,
): Awaitable<T> {
	if (!scopes?.length) return run();

	const scopedRun = scopes.reduceRight<() => Awaitable<T>>((next, scope) => () => scope(context, next), run);
	return scopedRun();
}

function omitPlugins(options: BaseClientOptions): SeyfertPluginOptions {
	const { plugins: _plugins, ...rest } = options;
	return rest;
}

function composeContext(
	target: BaseClientOptions,
	defaults: BaseClientOptions,
	pluginOptions: readonly SeyfertPluginOptions[],
	userOptions: SeyfertPluginOptions,
) {
	const callbacks: NonNullable<BaseClientOptions['context']>[] = [];
	if (typeof defaults.context === 'function') callbacks.push(defaults.context);
	callbacks.push(
		...pluginOptions
			.map(fragment => fragment.context)
			.filter((callback): callback is NonNullable<BaseClientOptions['context']> => typeof callback === 'function'),
	);
	if (typeof userOptions.context === 'function') callbacks.push(userOptions.context);
	if (!callbacks.length) return;

	target.context = interaction =>
		callbacks.reduce<Record<string, unknown>>((context, callback) => Object.assign(context, callback(interaction)), {});
}

function composeContextScopes(
	target: BaseClientOptions,
	defaults: BaseClientOptions,
	pluginOptions: readonly SeyfertPluginOptions[],
	userOptions: SeyfertPluginOptions,
) {
	const scopes = [
		...(defaults.contextScopes ?? []),
		...pluginOptions.flatMap(fragment => fragment.contextScopes ?? []),
		...(userOptions.contextScopes ?? []),
	];
	if (scopes.length) target.contextScopes = scopes;
}

function composeGlobalMiddlewares(
	target: BaseClientOptions,
	defaults: BaseClientOptions,
	pluginOptions: readonly PluginOptionContribution[],
	userOptions: SeyfertPluginOptions,
	registry: PluginRuntimeRegistry,
) {
	const registryMiddlewares = collectActiveRegistryGlobalMiddlewares(registry);
	const registryMiddlewareNames = new Set(
		[...registry.globalMiddlewares, ...registry.middlewares.filter(contribution => contribution.global)].map(
			contribution => contribution.name,
		),
	);
	const optionMiddlewares = pluginOptions.flatMap(contribution =>
		(contribution.fragment.globalMiddlewares ?? [])
			.map(name => String(name))
			.filter(name => !registryMiddlewareNames.has(name))
			.map(name => ({
				name,
				sequence: contribution.sequence,
			})),
	);
	const pluginMiddlewares = orderedPluginContributions<GlobalMiddlewareNameContribution>([
		...registryMiddlewares,
		...optionMiddlewares,
	]).map(contribution => contribution.name);
	const middlewares = uniqueMiddlewareNames([
		...(defaults.globalMiddlewares ?? []),
		...pluginMiddlewares,
		...(userOptions.globalMiddlewares ?? []),
	]);
	if (middlewares.length) target.globalMiddlewares = middlewares as never;
	else delete target.globalMiddlewares;
}

function collectActiveRegistryGlobalMiddlewares(registry: PluginRuntimeRegistry) {
	const additions = [
		...registry.globalMiddlewares,
		...registry.middlewares.filter(contribution => contribution.global),
	];
	const active = new Map<string, GlobalMiddlewareNameContribution>();
	const mutations = orderedPluginContributions([
		...additions.map(contribution => ({ ...contribution, kind: 'add' as const })),
		...registry.middlewareRemovals.map(contribution => ({ ...contribution, kind: 'remove' as const })),
	]);
	for (const mutation of mutations) {
		if (mutation.kind === 'remove') {
			for (const name of mutation.names) active.delete(name);
			continue;
		}
		active.set(mutation.name, mutation);
	}
	return [...active.values()];
}

type GlobalMiddlewareNameContribution = PluginOrderedContribution & { name: string };

function uniqueMiddlewareNames(middlewares: readonly unknown[]) {
	const names: string[] = [];
	const seen = new Set<string>();
	for (const middleware of middlewares) {
		const name = String(middleware);
		if (seen.has(name)) continue;
		seen.add(name);
		names.push(name);
	}
	return names;
}

function suppressesDefault(flag: boolean | readonly string[] | undefined, key: string) {
	return flag === true || (Array.isArray(flag) && flag.includes(key));
}

function composeDefaults<TDefaults extends object, TKey extends keyof TDefaults>(
	target: TDefaults | undefined,
	defaults: TDefaults | undefined,
	contributions: readonly PluginDefaultsContribution[],
	userDefaults: TDefaults | undefined,
	keys: readonly TKey[],
) {
	if (!target) return;

	const ordered = orderedPluginContributions(contributions);
	for (const key of keys) {
		const imperative = ordered.map(contribution => contribution.hooks?.[key as string] as unknown).filter(isFunction);
		const additive = [...imperative];
		const userHook = userDefaults?.[key] as unknown;

		if (!additive.length && typeof userHook !== 'function') continue;

		const suppressed = contributions.some(
			contribution =>
				isFunction(contribution.hooks?.[key as string]) &&
				suppressesDefault(contribution.suppressDefault, key as string),
		);
		const fallbackHook = defaults?.[key] as unknown;
		const base = isFunction(userHook)
			? userHook
			: suppressed
				? undefined
				: isFunction(fallbackHook)
					? fallbackHook
					: undefined;
		const hooks = base ? [...additive, base] : additive;
		if (hooks.length) target[key] = composeHooks(hooks) as TDefaults[TKey];
	}
}

function composeHooks(hooks: readonly AnyFunction[]) {
	return async (...args: unknown[]) => {
		for (const hook of hooks) await hook(...args);
	};
}

function collectPluginDefaultContributions(
	options: readonly PluginOptionContribution[],
	contributions: readonly PluginDefaultsContribution[],
	kind: PluginDefaultsContribution['kind'],
) {
	return [
		...options.flatMap(contribution => {
			const hooks = contribution.fragment[kind]?.defaults;
			if (!hooks) return [];
			return [
				{
					record: contribution.record,
					kind,
					hooks: hooks as Record<string, unknown>,
					scope: contribution.scope,
					order: contribution.order,
					sequence: contribution.sequence,
				} satisfies PluginDefaultsContribution,
			];
		}),
		...contributions.filter(contribution => contribution.kind === kind),
	];
}

function isFunction(value: unknown): value is AnyFunction {
	return typeof value === 'function';
}
