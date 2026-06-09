import { MergeOptions } from '../common';
import type { Awaitable } from '../common/types/util';
import type { BaseClient, BaseClientOptions, ContextScope, ContextScopeContext } from './base';
import { wrapPluginError } from './plugins/errors';
import {
	bindPluginClient,
	createPluginContextFragment,
	createPluginRuntimeRegistry,
	installPluginClientMaps,
	installPluginMiddlewares,
	type PluginRuntimeRegistry,
	runPluginRegister,
} from './plugins/registry';
import type {
	AnySeyfertPlugin,
	ResolvedPluginList,
	SeyfertCommandDefaults,
	SeyfertComponentDefaults,
	SeyfertModalDefaults,
	SeyfertPlugin,
	SeyfertPluginOptions,
} from './plugins/types';

export type {
	AnySeyfertPlugin,
	ContextOf,
	ExtendOf,
	HandleableComponent,
	HandleableModal,
	PluginClientMap,
	PluginContextInteraction,
	PluginContextMap,
	PluginContextOf,
	PluginDiagnostics,
	PluginExtensionOf,
	Register,
	RegisteredPluginContext,
	RegisteredPluginExtension,
	RegisteredPlugins,
	ResolvedPluginList,
	SeyfertCommandDefaults,
	SeyfertComponentDefaults,
	SeyfertModalDefaults,
	SeyfertPlugin,
	SeyfertPluginApi,
	SeyfertPluginClient,
	SeyfertPluginOptions,
} from './plugins/types';

type CommandDefaults = SeyfertCommandDefaults;
type ComponentDefaults = SeyfertComponentDefaults;
type ModalDefaults = SeyfertModalDefaults;
type AnyFunction = (...args: unknown[]) => unknown;
type LegacyPluginOptions = AnySeyfertPlugin & {
	options?(current: Readonly<BaseClientOptions>): SeyfertPluginOptions;
};

export interface ResolvedClientPlugins {
	plugins: ResolvedPluginList;
	options: BaseClientOptions;
	registry: PluginRuntimeRegistry;
}

export function createPlugin<
	const TPlugin extends SeyfertPlugin<any, any, readonly AnySeyfertPlugin[]> & Record<string, unknown>,
>(plugin: TPlugin): TPlugin {
	return plugin;
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
	const pluginOptions: SeyfertPluginOptions[] = [];

	for (const record of registry.records) {
		const contextFragment = createPluginContextFragment(record, registry);
		if (contextFragment) pluginOptions.push(contextFragment);

		const current = MergeOptions<BaseClientOptions>(defaults, ...pluginOptions, userOptions);
		try {
			const fragment = (record.plugin as LegacyPluginOptions).options?.(current);
			if (fragment) pluginOptions.push(fragment);
		} catch (error) {
			throw wrapPluginError(record.plugin.name, 'options', record.index, error);
		}

		runPluginRegister(record, registry);
		pluginOptions.push(...record.optionFragments);
	}

	const merged = MergeOptions<BaseClientOptions>(defaults, ...pluginOptions, userOptions);
	merged.plugins = registry.plugins;

	composeContext(merged, defaults, pluginOptions, userOptions);
	composeContextScopes(merged, defaults, pluginOptions, userOptions);
	composeGlobalMiddlewares(merged, defaults, pluginOptions, userOptions);
	composeDefaults(
		merged.commands?.defaults,
		defaults.commands?.defaults,
		pluginOptions.map(fragment => fragment.commands?.defaults),
		userOptions.commands?.defaults,
		commandHookKeys,
	);
	composeDefaults(
		merged.components?.defaults,
		defaults.components?.defaults,
		pluginOptions.map(fragment => fragment.components?.defaults),
		userOptions.components?.defaults,
		componentHookKeys,
	);
	composeDefaults(
		merged.modals?.defaults,
		defaults.modals?.defaults,
		pluginOptions.map(fragment => fragment.modals?.defaults),
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

export async function setupClientPlugins(
	client: BaseClient & { plugins: ResolvedPluginList },
	plugins: ResolvedPluginList,
) {
	const completed: AnySeyfertPlugin[] = [];

	try {
		for (let index = 0; index < plugins.length; index++) {
			const plugin = plugins[index]!;
			try {
				await plugin.setup?.(client as never);
				completed.push(plugin);
			} catch (error) {
				throw wrapPluginError(plugin.name, 'setup', index, error);
			}
		}
	} catch (setupError) {
		try {
			await teardownClientPlugins(client, completed);
		} catch (teardownError) {
			throw new AggregateError([setupError, teardownError], 'Seyfert plugin setup failed and cleanup also failed.');
		}
		throw setupError;
	}
}

export async function teardownClientPlugins(
	client: BaseClient & { plugins: ResolvedPluginList },
	plugins: readonly AnySeyfertPlugin[],
) {
	const errors: unknown[] = [];

	for (const plugin of [...plugins].reverse()) {
		const index = plugins.indexOf(plugin);
		try {
			await plugin.teardown?.(client as never);
		} catch (error) {
			errors.push(wrapPluginError(plugin.name, 'teardown', index, error));
		}
	}

	if (errors.length) throw new AggregateError(errors, 'Seyfert plugin teardown failed.');
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
	pluginOptions: readonly SeyfertPluginOptions[],
	userOptions: SeyfertPluginOptions,
) {
	const middlewares = [
		...(defaults.globalMiddlewares ?? []),
		...pluginOptions.flatMap(fragment => fragment.globalMiddlewares ?? []),
	];
	middlewares.push(...(userOptions.globalMiddlewares ?? []));
	if (middlewares.length) target.globalMiddlewares = middlewares;
}

function composeDefaults<TDefaults extends object, TKey extends keyof TDefaults>(
	target: TDefaults | undefined,
	defaults: TDefaults | undefined,
	pluginDefaults: readonly (TDefaults | undefined)[],
	userDefaults: TDefaults | undefined,
	keys: readonly TKey[],
) {
	if (!target) return;

	for (const key of keys) {
		const pluginHooks: AnyFunction[] = pluginDefaults.map(defaults => defaults?.[key] as unknown).filter(isFunction);
		const userHook = userDefaults?.[key] as unknown;
		const fallbackHook = defaults?.[key] as unknown;

		if (!pluginHooks.length && typeof userHook !== 'function') continue;

		const hooks = isFunction(userHook)
			? [...pluginHooks, userHook]
			: pluginHooks.length
				? pluginHooks
				: isFunction(fallbackHook)
					? [fallbackHook]
					: [];
		target[key] = composeHooks(hooks) as TDefaults[TKey];
	}
}

function composeHooks(hooks: readonly AnyFunction[]) {
	return async (...args: unknown[]) => {
		for (const hook of hooks) await hook(...args);
	};
}

function isFunction(value: unknown): value is AnyFunction {
	return typeof value === 'function';
}
