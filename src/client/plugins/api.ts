import { isGatewayEventName } from '../../events/utils';
import {
	hasPluginRequirement,
	type PluginRuntimeRecord,
	type PluginRuntimeRegistry,
	resolveGatewayIntent,
} from './registry';
import { addPluginService, serviceName } from './services';
import type { SeyfertPluginApi, SeyfertPluginOptions } from './types';

export function createPluginApi(record: PluginRuntimeRecord, registry: PluginRuntimeRegistry): SeyfertPluginApi {
	const addEvent: SeyfertPluginApi['events']['on'] = (name, handler, opts) => {
		registry.events.push({
			record,
			name: String(name),
			handler: handler as (...args: unknown[]) => unknown,
			once: opts?.once,
		});
	};

	return {
		has(req) {
			return hasPluginRequirement(registry, req);
		},
		events: {
			on(name, handler, opts) {
				addEvent(name, handler, opts);
			},
			once(name, handler) {
				addEvent(name, handler, { once: true });
			},
			onAny(handler) {
				registry.anyEvents.push({
					record,
					handler,
				});
			},
			emit(name, ...payload) {
				const eventName = String(name);
				if (isGatewayEventName(eventName)) {
					throw new Error(`Plugin "${record.plugin.name}" cannot emit gateway event "${eventName}".`);
				}
				const events = registry.client?.events;
				if (!events) {
					throw new Error(`Plugin "${record.plugin.name}" cannot emit "${eventName}" before events are available.`);
				}
				events.runCustom(name, ...payload);
			},
		},
		commands: {
			add(...commands) {
				registry.commands.push({ record, commands });
			},
		},
		components: {
			add(...components) {
				registry.components.push({ record, components });
			},
		},
		modals: {
			add(...modals) {
				registry.modals.push({ record, modals });
			},
		},
		middlewares: {
			add(name, middleware, opts) {
				registry.middlewares.push({
					record,
					name,
					middleware,
					global: opts?.global === true,
				});
				if (opts?.global) {
					record.optionFragments.push({ globalMiddlewares: [name as never] } satisfies SeyfertPluginOptions);
				}
			},
		},
		autocomplete: {
			wrap(wrapper) {
				registry.autocompleteWrappers.push({ record, wrapper });
			},
		},
		gateway: {
			addIntents(...intents) {
				registry.gatewayIntents.push({ record, intents: intents.map(resolveGatewayIntent) });
			},
			wrapPayload(wrapper) {
				registry.gatewayPayloadWrappers.push({ record, wrapper });
			},
		},
		services: {
			set(name: Parameters<SeyfertPluginApi['services']['set']>[0], value: unknown) {
				const key = serviceName(name as never);
				addPluginService(registry, record, key, typeof value === 'function' ? (value as never) : () => value);
			},
			has(name: Parameters<SeyfertPluginApi['services']['has']>[0]) {
				return registry.services.has(serviceName(name as never));
			},
		},
		diagnostics: {
			warn(message, options) {
				registry.diagnostics.push({
					plugin: record.plugin.name,
					index: record.index,
					phase: options?.phase ?? 'register',
					severity: 'warn',
					code: options?.code,
					message,
				});
			},
		},
		options: {
			set(fragment) {
				record.optionFragments.push(fragment);
			},
		},
	};
}
