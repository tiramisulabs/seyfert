import type { UsingClient } from '../commands';
import { MergeOptions } from '../common';
import type { Awaitable } from '../common/types/util';
import type { BaseClientOptions } from './base';

type ClientOptionsFragment = Partial<Omit<BaseClientOptions, 'plugins'>>;
type CommandDefaults = NonNullable<NonNullable<BaseClientOptions['commands']>['defaults']>;
type ComponentDefaults = NonNullable<NonNullable<BaseClientOptions['components']>['defaults']>;
type ModalDefaults = NonNullable<NonNullable<BaseClientOptions['modals']>['defaults']>;
type AnyFunction = (...args: unknown[]) => unknown;

export type SeyfertPluginClient = UsingClient & {
	plugins: readonly SeyfertPlugin[];
};

export interface SeyfertPlugin {
	name: string;
	options?(current: Readonly<BaseClientOptions>): ClientOptionsFragment;
	setup?(client: SeyfertPluginClient): Awaitable<void>;
}

export interface ResolvedClientPlugins {
	plugins: readonly SeyfertPlugin[];
	options: BaseClientOptions;
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
	const plugins = options.plugins ?? [];
	const userOptions = omitPlugins(options);
	const pluginOptions: ClientOptionsFragment[] = [];

	for (const plugin of plugins) {
		const current = MergeOptions<BaseClientOptions>(defaults, ...pluginOptions, userOptions);
		const fragment = plugin.options?.(current);
		if (fragment) pluginOptions.push(fragment);
	}

	const merged = MergeOptions<BaseClientOptions>(defaults, ...pluginOptions, userOptions);
	merged.plugins = plugins;

	composeContext(merged, pluginOptions, userOptions);
	composeGlobalMiddlewares(merged, pluginOptions, userOptions);
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

	return { plugins, options: merged };
}

export async function setupClientPlugins(client: SeyfertPluginClient, plugins: readonly SeyfertPlugin[]) {
	for (const plugin of plugins) await plugin.setup?.(client);
}

function omitPlugins(options: BaseClientOptions): ClientOptionsFragment {
	const { plugins: _plugins, ...rest } = options;
	return rest;
}

function composeContext(
	target: BaseClientOptions,
	pluginOptions: readonly ClientOptionsFragment[],
	userOptions: ClientOptionsFragment,
) {
	const callbacks = pluginOptions
		.map(fragment => fragment.context)
		.filter((callback): callback is NonNullable<BaseClientOptions['context']> => typeof callback === 'function');
	if (userOptions.context) callbacks.push(userOptions.context);
	if (!callbacks.length) return;

	target.context = interaction =>
		callbacks.reduce<Record<string, unknown>>((context, callback) => Object.assign(context, callback(interaction)), {});
}

function composeGlobalMiddlewares(
	target: BaseClientOptions,
	pluginOptions: readonly ClientOptionsFragment[],
	userOptions: ClientOptionsFragment,
) {
	const middlewares = pluginOptions.flatMap(fragment => [...(fragment.globalMiddlewares ?? [])]);
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

		const tailHook = typeof userHook === 'function' ? userHook : fallbackHook;
		const hooks = isFunction(tailHook) ? [...pluginHooks, tailHook] : pluginHooks;
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
