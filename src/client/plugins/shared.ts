import type { Awaitable } from '../../common/types/util';
import type { BaseClient } from '../base';
import { createPluginConflictError, wrapPluginError } from './errors';
import { nextPluginContributionSequence } from './order';
import {
	assertCanMutatePluginContribution,
	type PluginEventContributionScope,
	type PluginRuntimeRecord,
	type PluginRuntimeRegistry,
	recordContributionMutationDiagnostic,
} from './registry';
import type { PluginSharedRegistry, RegisteredPluginShared, SharedKey } from './types';

type SharedFactory = (client: BaseClient) => unknown;
type SharedDispose = (value: unknown) => Awaitable<void>;
type SharedRegistryState = {
	instances: Map<string, unknown>;
};

const sharedStates = new WeakMap<PluginSharedRegistry, SharedRegistryState>();

export function createSharedKey<const Name extends keyof RegisteredPluginShared & string>(
	name: Name,
): SharedKey<RegisteredPluginShared[Name], Name>;
export function createSharedKey<T>(): <const Name extends string>(name: Name) => SharedKey<T, Name>;
export function createSharedKey<const Name extends string>(name: Name): SharedKey<unknown, Name>;
export function createSharedKey<T, const Name extends string = string>(
	name?: Name,
): SharedKey<T, Name> | (<const KeyName extends string>(keyName: KeyName) => SharedKey<T, KeyName>) {
	if (name === undefined) return keyName => Object.freeze({ name: keyName }) as SharedKey<T, typeof keyName>;
	return Object.freeze({ name }) as SharedKey<T, Name>;
}

export function sharedName(name: string | SharedKey<unknown, string>) {
	return typeof name === 'string' ? name : name.name;
}

export function addPluginShared(
	registry: PluginRuntimeRegistry,
	record: PluginRuntimeRecord,
	name: string,
	factory: SharedFactory,
	scope: PluginEventContributionScope,
	opts?: { dispose?: SharedDispose; override?: boolean },
) {
	const owner = registry.sharedOwners.get(name);
	if (owner) {
		if (!opts?.override) {
			throw createPluginConflictError(
				record.plugin.name,
				`shared.${name}`,
				record.index,
				`Shared value "${name}" is already claimed by plugin "${owner.plugin.name}".`,
				record.plugin.instanceId,
			);
		}
		assertCanMutatePluginContribution(registry, record, 'override', 'shared', name, owner, `shared.${name}`);
		disposeSharedInstance(registry, name);
		recordSharedMutationDiagnostic(registry, record, 'override', name, owner);
	}
	registry.sharedOwners.set(name, record);
	registry.shared.set(name, { record, factory, dispose: opts?.dispose, scope });
}

export function removePluginShared(
	registry: PluginRuntimeRegistry,
	record: PluginRuntimeRecord,
	names: readonly string[],
) {
	for (const name of names) {
		const owner = registry.sharedOwners.get(name);
		if (!owner) continue;
		assertCanMutatePluginContribution(registry, record, 'remove', 'shared', name, owner, `shared.${name}`);
		disposeSharedInstance(registry, name);
		registry.shared.delete(name);
		if (registry.sharedOwners.get(name) === owner) registry.sharedOwners.delete(name);
		recordSharedMutationDiagnostic(registry, record, 'remove', name, owner);
	}
}

export function createSharedRegistry(client: BaseClient, registry: PluginRuntimeRegistry): PluginSharedRegistry {
	const instances = new Map<string, unknown>();

	const resolve = (name: string) => {
		if (instances.has(name)) return instances.get(name);
		const shared = registry.shared.get(name);
		if (!shared) return undefined;
		let value: unknown;
		try {
			value = shared.factory(client);
		} catch (error) {
			throw wrapPluginError(
				shared.record.plugin.name,
				`shared.${name}`,
				shared.record.index,
				error,
				undefined,
				shared.record.plugin.instanceId,
			);
		}
		instances.set(name, value);
		return value;
	};

	const shared = Object.freeze({
		get(name: string | SharedKey<unknown, string>) {
			return resolve(sharedName(name as never));
		},
		unwrap(name: string | SharedKey<unknown, string>) {
			const key = sharedName(name as never);
			const value = resolve(key);
			if (value === undefined) {
				throw createPluginConflictError('<shared>', `shared.${key}`, -1, `Shared value "${key}" is not registered.`);
			}
			return value;
		},
		has(name: string | SharedKey<unknown, string>) {
			return registry.shared.has(sharedName(name));
		},
	}) as PluginSharedRegistry;
	sharedStates.set(shared, { instances });
	return shared;
}

export async function disposePluginSharedValues(
	shared: PluginSharedRegistry,
	registry: PluginRuntimeRegistry,
	record: PluginRuntimeRecord,
) {
	const state = sharedStates.get(shared);
	if (!state) return [];

	const errors: unknown[] = [];
	for (const [name, contribution] of [...registry.shared.entries()].reverse()) {
		if (contribution.record !== record || !state.instances.has(name)) continue;
		const value = state.instances.get(name);
		try {
			await contribution.dispose?.(value);
		} catch (error) {
			errors.push(
				wrapPluginError(
					contribution.record.plugin.name,
					`shared.${name}`,
					contribution.record.index,
					error,
					'PLUGIN_TEARDOWN_FAILED',
					contribution.record.plugin.instanceId,
				),
			);
		} finally {
			state.instances.delete(name);
		}
	}
	return errors;
}

export function cleanupPluginSharedContributions(
	registry: PluginRuntimeRegistry,
	record: PluginRuntimeRecord,
	shouldRemove: (contribution: { scope: PluginEventContributionScope }) => boolean,
) {
	for (const [name, contribution] of registry.shared) {
		if (contribution.record !== record || !shouldRemove(contribution)) continue;
		registry.shared.delete(name);
		if (registry.sharedOwners.get(name) === record) registry.sharedOwners.delete(name);
	}
}

export function cleanupPluginDynamicSharedContributions(registry: PluginRuntimeRegistry, record: PluginRuntimeRecord) {
	cleanupPluginSharedContributions(registry, record, contribution => contribution.scope !== 'register');
}

export function clearSharedRegistryInstances(shared: PluginSharedRegistry) {
	sharedStates.get(shared)?.instances.clear();
}

function disposeSharedInstance(registry: PluginRuntimeRegistry, name: string) {
	const shared = registry.client?.shared;
	if (!shared) return;
	const state = sharedStates.get(shared);
	if (!state?.instances.has(name)) return;
	const value = state.instances.get(name);
	const contribution = registry.shared.get(name);
	try {
		const pluginName = contribution?.record.plugin.name ?? '<unknown>';
		const result = contribution?.dispose?.(value);
		if (isPromiseLike(result)) {
			result.catch(error => {
				registry.client?.logger.error(`[plugin:${pluginName}] shared.${name} dispose failed`, error);
			});
		}
	} catch (error) {
		registry.client?.logger.error(
			`[plugin:${contribution?.record.plugin.name ?? '<unknown>'}] shared.${name} dispose failed`,
			error,
		);
	} finally {
		state.instances.delete(name);
	}
}

function recordSharedMutationDiagnostic(
	registry: PluginRuntimeRegistry,
	record: PluginRuntimeRecord,
	action: 'override' | 'remove',
	name: string,
	owner: PluginRuntimeRecord,
) {
	recordContributionMutationDiagnostic(
		registry,
		{ record, sequence: nextPluginContributionSequence(registry) },
		action,
		'shared',
		name,
		owner,
		`shared.${name}`,
	);
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
	return (
		typeof value === 'object' &&
		value !== null &&
		'then' in value &&
		typeof (value as { then?: unknown }).then === 'function'
	);
}
