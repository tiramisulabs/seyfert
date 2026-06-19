import type { MiddlewareContext } from '../../commands';
import type { HandleableCommand } from '../../commands/handler';
import { createPluginConflictError } from './errors';
import { nextPluginContributionSequence } from './order';
import {
	addPluginDiagnostic,
	addPluginOptionFragment,
	assertSafePluginResourceName,
	hasPluginRequirement,
	type PluginEventContributionScope,
	type PluginRuntimeRecord,
	type PluginRuntimeRegistry,
	removePluginAnyEventContribution,
	removePluginCommandObserverContribution,
	removePluginEventContribution,
	removePluginEventErrorContribution,
	removePluginGatewayDispatchInterceptorContribution,
	removePluginHookContribution,
	removePluginRestObserverContribution,
	resolveGatewayIntent,
	unknownGatewayIntentBits,
} from './registry';
import { addPluginShared, removePluginShared, sharedName } from './shared';
import type {
	HandleableComponent,
	HandleableModal,
	PluginCacheResourceConstructor,
	PluginCommandContributionOptions,
	PluginContributionOptions,
	PluginHandlerOptions,
	PluginOrderOpt,
	SeyfertPluginApi,
	SeyfertPluginOptions,
	SeyfertPluginTeardownApi,
	SharedKey,
} from './types';

type PluginSharedName = string | SharedKey<unknown, string>;

const reservedCacheResourceNames = new Set([
	'__logger__',
	'__proto__',
	'adapter',
	'bans',
	'buildCache',
	'bulkGet',
	'bulkPatch',
	'bulkSet',
	'channels',
	'constructor',
	'emojis',
	'flush',
	'guilds',
	'hasChannelsIntent',
	'hasDirectMessages',
	'hasGuildExpressionsIntent',
	'hasGuildMembersIntent',
	'hasGuildsIntent',
	'hasIntent',
	'hasModerationIntent',
	'hasPrenseceUpdates',
	'hasRolesIntent',
	'hasVoiceStates',
	'intents',
	'members',
	'messages',
	'onPacket',
	'onPacketDefault',
	'overwrites',
	'pluginResourceNames',
	'pluginResourcePacketHandlers',
	'presences',
	'prototype',
	'roles',
	'stageInstances',
	'stickers',
	'users',
	'voiceStates',
]);
const noReservedPluginKeys = new Set<string>();
const handlerKinds = new Set(['command', 'component', 'modal']);

export function createPluginApi(
	record: PluginRuntimeRecord,
	registry: PluginRuntimeRegistry,
	scope: 'teardown',
): SeyfertPluginTeardownApi;
export function createPluginApi(
	record: PluginRuntimeRecord,
	registry: PluginRuntimeRegistry,
	scope?: Exclude<PluginEventContributionScope, 'teardown'>,
): SeyfertPluginApi;
export function createPluginApi(
	record: PluginRuntimeRecord,
	registry: PluginRuntimeRegistry,
	scope: PluginEventContributionScope = 'register',
): SeyfertPluginApi | SeyfertPluginTeardownApi {
	const assertCanMutate = (phase: string) => {
		if (scope !== 'teardown') return;
		throw createPluginConflictError(
			record.plugin.name,
			phase,
			record.index,
			`Plugin "${record.plugin.name}" cannot mutate plugin contributions during teardown.`,
			record.plugin.instanceId,
		);
	};
	const addEvent: SeyfertPluginApi['events']['on'] = (name, handler, opts) => {
		assertCanMutate(`events.${String(name)}`);
		const contribution = {
			record,
			name: String(name),
			handler: handler as (...args: unknown[]) => unknown,
			scope,
			active: true,
			order: opts?.order,
			sequence: nextPluginContributionSequence(registry),
			once: opts?.once,
		};
		registry.events.push(contribution);
		return once(() => removePluginEventContribution(registry, contribution));
	};

	return {
		has(req) {
			return hasPluginRequirement(registry, req);
		},
		events: {
			on(name, handler, opts) {
				return addEvent(name, handler, opts);
			},
			once(name, handler) {
				return addEvent(name, handler, { once: true });
			},
			onAny(handler, opts) {
				assertCanMutate('events.onAny');
				const contribution = {
					record,
					handler,
					scope,
					active: true,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				};
				registry.anyEvents.push(contribution);
				return once(() => removePluginAnyEventContribution(registry, contribution));
			},
			onError(handler, opts) {
				assertCanMutate('events.onError');
				const contribution = {
					record,
					handler,
					scope,
					active: true,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				};
				registry.eventErrors.push(contribution);
				return once(() => removePluginEventErrorContribution(registry, contribution));
			},
		},
		commands: {
			add(...args) {
				assertCanMutate('commands.add');
				const [commands, opts] = splitContributionArgs<
					InstanceType<HandleableCommand> | HandleableCommand,
					PluginCommandContributionOptions
				>(args, isCommandContributionOptions);
				if (opts?.guilds?.length) {
					addPluginDiagnostic(registry, record, {
						phase: 'commands.add',
						severity: 'info',
						code: 'command-guild-scope',
						message: `Plugin "${record.plugin.name}" registered a guild-scoped command contribution.`,
						data: { guilds: [...opts.guilds], commands: commands.length },
					});
				}
				registry.commands.push({
					record,
					commands,
					scope,
					override: opts?.override === true,
					guilds: opts?.guilds ? [...opts.guilds] : undefined,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			remove(...names) {
				assertCanMutate('commands.remove');
				registry.commandRemovals.push({
					record,
					names,
					scope,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			observe(observer, opts) {
				assertCanMutate('commands.observe');
				const contribution = {
					record,
					observer,
					scope,
					active: true,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				};
				registry.commandObservers.push(contribution);
				return once(() => removePluginCommandObserverContribution(registry, contribution));
			},
			defaults(hooks, opts) {
				assertCanMutate('commands.defaults');
				registry.pluginDefaults.push({
					record,
					kind: 'commands',
					hooks: hooks as Record<string, unknown>,
					suppressDefault: opts?.suppressDefault as boolean | readonly string[] | undefined,
					scope,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				});
			},
		},
		rest: {
			observe(observer, order) {
				assertCanMutate('rest.observe');
				const contribution = {
					record,
					observer,
					scope,
					active: true,
					order: normalizeOrder(order),
					sequence: nextPluginContributionSequence(registry),
				};
				registry.restObservers.push(contribution);
				return once(() => removePluginRestObserverContribution(registry, contribution));
			},
		},
		hooks: {
			on(name, handler, opts) {
				assertCanMutate(`hooks.${name}`);
				const contribution = {
					record,
					name,
					handler: handler as (...args: unknown[]) => unknown,
					scope,
					active: true,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				};
				registry.hooks.push(contribution);
				return once(() => removePluginHookContribution(registry, contribution));
			},
			tap(name, handler, opts) {
				return this.on(name, handler, opts);
			},
		},
		handlers: {
			construct(creator, opts) {
				assertCanMutate('handlers.construct');
				registry.handlerCreators.push({
					record,
					creator,
					scope,
					kinds: normalizeHandlerKinds(record, opts),
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			create(creator, opts) {
				this.construct(creator, opts);
			},
			transform(transformer, opts) {
				assertCanMutate('handlers.transform');
				registry.handlerTransformers.push({
					record,
					transformer,
					scope,
					kinds: normalizeHandlerKinds(record, opts),
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				});
			},
		},
		components: {
			add(...args) {
				assertCanMutate('components.add');
				const [components, opts] = splitContributionArgs<InstanceType<HandleableComponent> | HandleableComponent>(args);
				registry.components.push({
					record,
					components,
					scope,
					override: opts?.override === true,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			remove(...customIds) {
				assertCanMutate('components.remove');
				registry.componentRemovals.push({
					record,
					customIds,
					scope,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			defaults(hooks, opts) {
				assertCanMutate('components.defaults');
				registry.pluginDefaults.push({
					record,
					kind: 'components',
					hooks: hooks as Record<string, unknown>,
					suppressDefault: opts?.suppressDefault as boolean | readonly string[] | undefined,
					scope,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				});
			},
		},
		modals: {
			add(...args) {
				assertCanMutate('modals.add');
				const [modals, opts] = splitContributionArgs<InstanceType<HandleableModal> | HandleableModal>(args);
				registry.modals.push({
					record,
					modals,
					scope,
					override: opts?.override === true,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			remove(...customIds) {
				assertCanMutate('modals.remove');
				registry.modalRemovals.push({
					record,
					customIds,
					scope,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			defaults(hooks, opts) {
				assertCanMutate('modals.defaults');
				registry.pluginDefaults.push({
					record,
					kind: 'modals',
					hooks: hooks as Record<string, unknown>,
					suppressDefault: opts?.suppressDefault as boolean | readonly string[] | undefined,
					scope,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				});
			},
		},
		middlewares: {
			add(
				name: string,
				middleware: MiddlewareContext,
				opts?: { global?: boolean; order?: PluginOrderOpt; override?: boolean },
			) {
				assertCanMutate(`middlewares.${name}`);
				assertSafePluginResourceName(record, `middlewares.${name}`, name, noReservedPluginKeys);
				registry.middlewares.push({
					record,
					name,
					middleware,
					global: opts?.global === true,
					override: opts?.override === true,
					scope,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				});
				if (opts?.global) {
					addPluginOptionFragment(
						registry,
						record,
						{
							globalMiddlewares: [name as never],
						} satisfies SeyfertPluginOptions,
						scope,
					);
				}
			},
			remove(...names) {
				assertCanMutate('middlewares.remove');
				for (const name of names) {
					assertSafePluginResourceName(record, `middlewares.${name}`, name, noReservedPluginKeys);
				}
				registry.middlewareRemovals.push({
					record,
					names,
					scope,
					sequence: nextPluginContributionSequence(registry),
				});
			},
		},
		autocomplete: {
			wrap(wrapper, opts) {
				assertCanMutate('autocomplete.wrap');
				registry.autocompleteWrappers.push({
					record,
					wrapper,
					scope,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				});
			},
		},
		gateway: {
			addIntents(...intents) {
				assertCanMutate('gateway.addIntents');
				const resolvedIntents: number[] = [];
				for (const intent of intents) {
					const resolved = resolveGatewayIntent(intent);
					if (resolved === undefined) {
						addPluginDiagnostic(registry, record, {
							phase: 'gateway.addIntents',
							severity: 'warn',
							code: 'unknown-intent-bits',
							message: `Gateway intent "${String(intent)}" is unknown.`,
							data: { intent },
						});
						continue;
					}
					const unknownBits = unknownGatewayIntentBits(resolved);
					if (unknownBits) {
						addPluginDiagnostic(registry, record, {
							phase: 'gateway.addIntents',
							severity: 'warn',
							code: 'unknown-intent-bits',
							message: `Gateway intent value "${resolved}" includes unknown bits "${unknownBits}".`,
							data: { intent: resolved, unknownBits },
						});
					}
					resolvedIntents.push(resolved);
				}
				if (resolvedIntents.length) registry.gatewayIntents.push({ record, intents: resolvedIntents, scope });
			},
			wrapPayload(wrapper, opts) {
				assertCanMutate('gateway.wrapPayload');
				registry.gatewayPayloadWrappers.push({
					record,
					wrapper,
					scope,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			onDispatch(interceptor, opts) {
				assertCanMutate('gateway.onDispatch');
				const contribution = {
					record,
					interceptor,
					scope,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				};
				registry.gatewayDispatchInterceptors.push(contribution);
				return once(() => removePluginGatewayDispatchInterceptorContribution(registry, contribution));
			},
		},
		cache: {
			resource(name: string, resource: PluginCacheResourceConstructor, opts) {
				assertCanMutate('cache.resource');
				assertSafePluginResourceName(record, 'cache.resource', name, reservedCacheResourceNames);
				const existing = registry.cacheResources.find(contribution => contribution.name === name);
				if (existing) {
					throw createPluginConflictError(
						record.plugin.name,
						'cache.resource',
						record.index,
						`Cache resource "${name}" is already registered by plugin "${existing.record.identity}".`,
						record.plugin.instanceId,
					);
				}
				if (opts?.intents?.length) {
					const resolvedIntents: number[] = [];
					for (const intent of opts.intents) {
						const resolved = resolveGatewayIntent(intent);
						if (resolved === undefined) {
							addPluginDiagnostic(registry, record, {
								phase: 'cache.resource',
								severity: 'warn',
								code: 'unknown-intent-bits',
								message: `Gateway intent "${String(intent)}" is unknown.`,
								data: { intent },
							});
							continue;
						}
						const unknownBits = unknownGatewayIntentBits(resolved);
						if (unknownBits) {
							addPluginDiagnostic(registry, record, {
								phase: 'cache.resource',
								severity: 'warn',
								code: 'unknown-intent-bits',
								message: `Gateway intent value "${resolved}" includes unknown bits "${unknownBits}".`,
								data: { intent: resolved, unknownBits },
							});
						}
						resolvedIntents.push(resolved);
					}
					if (resolvedIntents.length) registry.gatewayIntents.push({ record, intents: resolvedIntents, scope });
				}
				registry.cacheResources.push({
					record,
					name,
					resource,
					scope,
					onPacket: opts?.onPacket,
					sequence: nextPluginContributionSequence(registry),
				});
			},
		},
		shared: {
			set(name: PluginSharedName, factory: unknown, opts?: { dispose?: (value: unknown) => unknown }) {
				assertCanMutate(`shared.${sharedName(name)}`);
				const key = sharedName(name);
				assertSafePluginResourceName(record, `shared.${key}`, key, noReservedPluginKeys);
				addPluginShared(registry, record, key, factory as never, scope, opts as never);
			},
			remove(...names: PluginSharedName[]) {
				assertCanMutate('shared.remove');
				const keys = names.map(sharedName);
				for (const key of keys) assertSafePluginResourceName(record, `shared.${key}`, key, noReservedPluginKeys);
				removePluginShared(registry, record, keys, scope);
			},
			has(name: PluginSharedName) {
				return registry.shared.has(sharedName(name));
			},
		},
		langs: {
			contribute(locale, values, options) {
				assertCanMutate('langs.contribute');
				if (!isValidLangPrefix(options?.prefix)) {
					throw createPluginConflictError(
						record.plugin.name,
						'langs.contribute',
						record.index,
						'langs.contribute locale prefix must contain at least one non-empty path segment.',
						record.plugin.instanceId,
					);
				}
				registry.langs.push({
					record,
					locale,
					prefix: options.prefix,
					values,
					scope,
					sequence: nextPluginContributionSequence(registry),
				});
			},
		},
		reload() {
			assertCanMutate('reload');
			const client = registry.client;
			if (!client) {
				throw createPluginConflictError(
					record.plugin.name,
					'reload',
					record.index,
					`Plugin "${record.plugin.name}" cannot reload before the client is available.`,
					record.plugin.instanceId,
				);
			}
			return client.reloadPluginContributions();
		},
		diagnostics: {
			warn(message, options) {
				addPluginDiagnostic(registry, record, {
					phase: options?.phase ?? 'register',
					severity: 'warn',
					code: options?.code,
					message,
					data: options?.data,
				});
			},
		},
		options: {
			set(fragment) {
				assertCanMutate('options.set');
				addPluginOptionFragment(registry, record, fragment, scope);
			},
		},
	};
}

function once(dispose: () => void) {
	let disposed = false;
	return () => {
		if (disposed) return;
		disposed = true;
		dispose();
	};
}

function normalizeHandlerKinds(record: PluginRuntimeRecord, opts: PluginHandlerOptions | undefined) {
	if (!opts?.kinds) return undefined;
	for (const kind of opts.kinds) {
		if (handlerKinds.has(kind)) continue;
		throw createPluginConflictError(
			record.plugin.name,
			'handlers.kinds',
			record.index,
			`Handler kind "${String(kind)}" is invalid.`,
			record.plugin.instanceId,
		);
	}
	return [...opts.kinds];
}

function isValidLangPrefix(prefix: string | undefined) {
	if (!prefix) return false;
	return prefix.split('.').some(segment => segment.length > 0);
}

function normalizeOrder(order: PluginOrderOpt | { order?: PluginOrderOpt } | undefined) {
	return typeof order === 'object' && order !== null ? order.order : order;
}

function splitContributionArgs<T, O extends PluginContributionOptions = PluginContributionOptions>(
	args: readonly (T | O)[],
	isOptions: (value: unknown) => value is O = isPlainContributionOptions as (value: unknown) => value is O,
): [T[], O | undefined] {
	const last = args.at(-1);
	if (isOptions(last)) return [args.slice(0, -1) as T[], last];
	return [args as T[], undefined];
}

function isPlainContributionOptions(value: unknown): value is PluginContributionOptions {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) return false;
	return Object.keys(value).every(key => key === 'override');
}

function isCommandContributionOptions(value: unknown): value is PluginCommandContributionOptions {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) return false;
	return Object.entries(value).every(([key, option]) => {
		if (key === 'override') return typeof option === 'boolean';
		if (key === 'guilds') return Array.isArray(option) && option.every(guild => typeof guild === 'string');
		return false;
	});
}
