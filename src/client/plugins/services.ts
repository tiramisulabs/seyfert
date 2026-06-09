import type { BaseClient } from '../base';
import { createPluginConflictError, wrapPluginError } from './errors';
import type { PluginRuntimeRecord, PluginRuntimeRegistry } from './registry';
import type { PluginServiceRegistry, RegisteredPluginServices, ServiceKey } from './types';

type ServiceFactory = (client: BaseClient) => unknown;

export function createServiceKey<const Name extends keyof RegisteredPluginServices & string>(
	name: Name,
): ServiceKey<RegisteredPluginServices[Name], Name>;
export function createServiceKey<T, const Name extends string = string>(name: Name): ServiceKey<T, Name>;
export function createServiceKey<T, const Name extends string = string>(name: Name): ServiceKey<T, Name> {
	return Object.freeze({ name }) as ServiceKey<T, Name>;
}

export function serviceName(name: string | ServiceKey<unknown, string>) {
	return typeof name === 'string' ? name : name.name;
}

export function addPluginService(
	registry: PluginRuntimeRegistry,
	record: PluginRuntimeRecord,
	name: string,
	factory: ServiceFactory,
) {
	const owner = registry.serviceOwners.get(name);
	if (owner) {
		throw createPluginConflictError(
			record.plugin.name,
			`services.${name}`,
			record.index,
			`Service "${name}" is already claimed by plugin "${owner.plugin.name}".`,
		);
	}
	registry.serviceOwners.set(name, record);
	registry.services.set(name, { record, factory });
}

export function createServiceRegistry(client: BaseClient, registry: PluginRuntimeRegistry): PluginServiceRegistry {
	const instances = new Map<string, unknown>();

	const resolve = (name: string) => {
		if (instances.has(name)) return instances.get(name);
		const service = registry.services.get(name);
		if (!service) return undefined;
		let value: unknown;
		try {
			value = service.factory(client);
		} catch (error) {
			throw wrapPluginError(service.record.plugin.name, `services.${name}`, service.record.index, error);
		}
		instances.set(name, value);
		return value;
	};

	return Object.freeze({
		get(name: string | ServiceKey<unknown, string>) {
			return resolve(serviceName(name as never));
		},
		require(name: string | ServiceKey<unknown, string>) {
			const key = serviceName(name as never);
			const value = resolve(key);
			if (value === undefined) throw new Error(`Seyfert plugin service "${key}" is not registered.`);
			return value;
		},
		has(name: string | ServiceKey<unknown, string>) {
			return registry.services.has(serviceName(name));
		},
	}) as PluginServiceRegistry;
}
