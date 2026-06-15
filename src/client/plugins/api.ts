import type { MiddlewareContext } from '../../commands';
import type { HandleableCommand } from '../../commands/handler';
import { isGatewayEventName } from '../../events/utils';
import { createPluginConflictError } from './errors';
import { nextPluginContributionSequence } from './order';
import {
	addPluginDiagnostic,
	addPluginOptionFragment,
	hasPluginRequirement,
	type PluginEventContributionScope,
	type PluginRuntimeRecord,
	type PluginRuntimeRegistry,
	removePluginAnyEventContribution,
	removePluginCommandObserverContribution,
	removePluginEventContribution,
	removePluginEventErrorContribution,
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
	PluginOrderOpt,
	SeyfertPluginApi,
	SeyfertPluginOptions,
	SharedKey,
} from './types';

type PluginSharedName = string | SharedKey<unknown, string>;

const reservedCacheResourceNames = new Set([
	'adapter',
	'bans',
	'buildCache',
	'bulkGet',
	'bulkPatch',
	'bulkSet',
	'channels',
	'emojis',
	'flush',
	'guilds',
	'intents',
	'members',
	'messages',
	'onPacket',
	'overwrites',
	'presences',
	'roles',
	'stageInstances',
	'stickers',
	'users',
	'voiceStates',
]);

export function createPluginApi(
	record: PluginRuntimeRecord,
	registry: PluginRuntimeRegistry,
	scope: PluginEventContributionScope = 'register',
): SeyfertPluginApi {
	const addEvent: SeyfertPluginApi['events']['on'] = (name, handler, opts) => {
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
			emit(name, ...payload) {
				const eventName = String(name);
				if (isGatewayEventName(eventName)) {
					throw createPluginConflictError(
						record.plugin.name,
						`event:${eventName}`,
						record.index,
						`Plugin "${record.plugin.name}" cannot emit gateway event "${eventName}".`,
						record.plugin.instanceId,
					);
				}
				const events = registry.client?.events;
				if (!events) {
					throw createPluginConflictError(
						record.plugin.name,
						`event:${eventName}`,
						record.index,
						`Plugin "${record.plugin.name}" cannot emit "${eventName}" before events are available.`,
						record.plugin.instanceId,
					);
				}
				return Promise.resolve(events.runCustom(name, ...payload));
			},
		},
		commands: {
			add(...args) {
				const [commands, opts] = splitContributionArgs<HandleableCommand, PluginCommandContributionOptions>(
					args,
					isCommandContributionOptions,
				);
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
				registry.commandRemovals.push({
					record,
					names,
					scope,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			observe(observer, opts) {
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
				const contribution = {
					record,
					observer,
					scope,
					active: true,
					order,
					sequence: nextPluginContributionSequence(registry),
				};
				registry.restObservers.push(contribution);
				return once(() => removePluginRestObserverContribution(registry, contribution));
			},
		},
		hooks: {
			tap(name, handler, opts) {
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
		},
		components: {
			add(...args) {
				const [components, opts] = splitContributionArgs<HandleableComponent>(args);
				registry.components.push({
					record,
					components,
					scope,
					override: opts?.override === true,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			remove(...customIds) {
				registry.componentRemovals.push({
					record,
					customIds,
					scope,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			defaults(hooks, opts) {
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
				const [modals, opts] = splitContributionArgs<HandleableModal>(args);
				registry.modals.push({
					record,
					modals,
					scope,
					override: opts?.override === true,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			remove(...customIds) {
				registry.modalRemovals.push({
					record,
					customIds,
					scope,
					sequence: nextPluginContributionSequence(registry),
				});
			},
			defaults(hooks, opts) {
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
				registry.autocompleteWrappers.push({
					record,
					wrapper,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				});
			},
		},
		gateway: {
			addIntents(...intents) {
				for (const intent of intents) {
					const unknownBits = unknownGatewayIntentBits(intent);
					if (!unknownBits) continue;
					addPluginDiagnostic(registry, record, {
						phase: 'gateway.addIntents',
						severity: 'warn',
						code: 'unknown-intent-bits',
						message: `Gateway intent value "${intent}" includes unknown bits "${unknownBits}".`,
						data: { intent, unknownBits },
					});
				}
				registry.gatewayIntents.push({ record, intents: intents.map(resolveGatewayIntent) });
			},
			wrapPayload(wrapper, opts) {
				registry.gatewayPayloadWrappers.push({
					record,
					wrapper,
					order: opts?.order,
					sequence: nextPluginContributionSequence(registry),
				});
			},
		},
		cache: {
			resource(name: string, resource: PluginCacheResourceConstructor, opts) {
				if (reservedCacheResourceNames.has(name)) {
					throw createPluginConflictError(
						record.plugin.name,
						'cache.resource',
						record.index,
						`Cache resource "${name}" is reserved or already exists.`,
						record.plugin.instanceId,
					);
				}
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
					for (const intent of opts.intents) {
						const unknownBits = unknownGatewayIntentBits(intent);
						if (!unknownBits) continue;
						addPluginDiagnostic(registry, record, {
							phase: 'cache.resource',
							severity: 'warn',
							code: 'unknown-intent-bits',
							message: `Gateway intent value "${intent}" includes unknown bits "${unknownBits}".`,
							data: { intent, unknownBits },
						});
					}
					registry.gatewayIntents.push({ record, intents: opts.intents.map(resolveGatewayIntent) });
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
				const key = sharedName(name);
				addPluginShared(registry, record, key, factory as never, scope, opts as never);
			},
			remove(...names: PluginSharedName[]) {
				removePluginShared(registry, record, names.map(sharedName));
			},
			has(name: PluginSharedName) {
				return registry.shared.has(sharedName(name));
			},
		},
		langs: {
			contribute(locale, values, options) {
				if (!options?.prefix) {
					throw createPluginConflictError(
						record.plugin.name,
						'langs.contribute',
						record.index,
						'langs.contribute locale prefix is required.',
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
