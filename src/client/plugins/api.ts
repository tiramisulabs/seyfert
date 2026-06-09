import { isGatewayEventName } from '../../events/utils';
import type { PluginRuntimeRecord, PluginRuntimeRegistry } from './registry';
import type { SeyfertPluginApi, SeyfertPluginOptions } from './types';

export function createPluginApi(record: PluginRuntimeRecord, registry: PluginRuntimeRegistry): SeyfertPluginApi {
	return {
		events: {
			on(name, handler, opts) {
				registry.events.push({
					record,
					name: String(name),
					handler: handler as (...args: unknown[]) => unknown,
					once: opts?.once,
				});
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
		options: {
			set(fragment) {
				record.optionFragments.push(fragment);
			},
		},
	};
}
