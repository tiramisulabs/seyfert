import type { MiddlewareContext } from '../../commands';
import type { HandleableCommand } from '../../commands/handler';
import type { BaseClient } from '../base';
import { createPluginApi } from './api';
import { createPluginConflictError, wrapPluginError } from './errors';
import type {
	AnySeyfertPlugin,
	HandleableComponent,
	HandleableModal,
	PluginContextInteraction,
	PluginDiagnostics,
	ResolvedPluginList,
	SeyfertPluginOptions,
} from './types';

export interface PluginRuntimeRecord {
	plugin: AnySeyfertPlugin;
	index: number;
	imports: readonly AnySeyfertPlugin[];
	clientKeys: readonly string[];
	ctxKeys: readonly string[];
	optionFragments: SeyfertPluginOptions[];
}

export interface PluginCommandContribution {
	record: PluginRuntimeRecord;
	commands: readonly HandleableCommand[];
}

export interface PluginComponentContribution {
	record: PluginRuntimeRecord;
	components: readonly HandleableComponent[];
}

export interface PluginModalContribution {
	record: PluginRuntimeRecord;
	modals: readonly HandleableModal[];
}

export interface PluginEventContribution {
	record: PluginRuntimeRecord;
	name: string;
	handler: (...args: unknown[]) => unknown;
	once?: boolean;
	fired?: boolean;
}

export interface PluginAnyEventContribution {
	record: PluginRuntimeRecord;
	handler: (name: string, ...args: unknown[]) => unknown;
}

export interface PluginMiddlewareContribution {
	record: PluginRuntimeRecord;
	name: string;
	middleware: MiddlewareContext;
	global: boolean;
}

export interface PluginRuntimeRegistry {
	plugins: ResolvedPluginList;
	records: readonly PluginRuntimeRecord[];
	commands: PluginCommandContribution[];
	components: PluginComponentContribution[];
	modals: PluginModalContribution[];
	events: PluginEventContribution[];
	anyEvents: PluginAnyEventContribution[];
	middlewares: PluginMiddlewareContribution[];
	client?: BaseClient;
}

export function createPluginRuntimeRegistry(plugins: readonly AnySeyfertPlugin[] = []): PluginRuntimeRegistry {
	const ordered = resolvePluginOrder(plugins);
	const records = ordered.map<PluginRuntimeRecord>((plugin, index) => ({
		plugin,
		index,
		imports: plugin.imports ?? [],
		clientKeys: Object.keys(plugin.client ?? {}),
		ctxKeys: Object.keys(plugin.ctx ?? {}),
		optionFragments: [],
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
		middlewares: [],
	};

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
			throw new Error('register(api) must be synchronous.');
		}
	} catch (error) {
		throw wrapPluginError(record.plugin.name, 'register', record.index, error);
	}
}

export function bindPluginClient(registry: PluginRuntimeRegistry, client: BaseClient) {
	registry.client = client;
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
				);
			}
			const context: Record<string, unknown> = {};
			for (const [key, factory] of Object.entries(map)) {
				try {
					context[key] = factory(interaction, registry.client);
				} catch (error) {
					throw wrapPluginError(record.plugin.name, `ctx.${key}`, record.index, error);
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
				);
			}
			const owner = claimed.get(key);
			if (owner) {
				throw createPluginConflictError(
					record.plugin.name,
					`client.${key}`,
					record.index,
					`Client key "${key}" is already claimed by plugin "${owner.plugin.name}".`,
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
				throw wrapPluginError(record.plugin.name, `client.${key}`, record.index, error);
			}
		}
	}
}

export function installPluginMiddlewares(client: BaseClient, registry: PluginRuntimeRegistry) {
	if (!registry.middlewares.length) return;
	const middlewares = { ...(client.middlewares ?? {}) };

	for (const contribution of registry.middlewares) {
		if (contribution.name in middlewares) {
			throw createPluginConflictError(
				contribution.record.plugin.name,
				`middlewares.${contribution.name}`,
				contribution.record.index,
				`Middleware "${contribution.name}" is already registered.`,
			);
		}
		middlewares[contribution.name] = contribution.middleware;
	}

	client.middlewares = middlewares;
}

function resolvePluginOrder(plugins: readonly AnySeyfertPlugin[]) {
	const ordered: AnySeyfertPlugin[] = [];
	const seen = new Set<AnySeyfertPlugin>();
	const visiting = new Set<AnySeyfertPlugin>();
	const names = new Map<string, AnySeyfertPlugin>();

	const visit = (plugin: AnySeyfertPlugin, chain: readonly string[]) => {
		if (!plugin.name) throw new Error('Seyfert plugins must have a name.');
		const existing = names.get(plugin.name);
		if (existing && existing !== plugin) {
			throw createPluginConflictError(
				plugin.name,
				'resolve',
				ordered.length,
				`Duplicate plugin name "${plugin.name}".`,
			);
		}
		names.set(plugin.name, plugin);
		if (seen.has(plugin)) return;
		if (visiting.has(plugin)) {
			throw createPluginConflictError(
				plugin.name,
				'resolve',
				ordered.length,
				`Circular plugin import detected: ${[...chain, plugin.name].join(' -> ')}.`,
			);
		}

		visiting.add(plugin);
		for (const imported of plugin.imports ?? []) visit(imported, [...chain, plugin.name]);
		visiting.delete(plugin);
		seen.add(plugin);
		ordered.push(plugin);
	};

	for (const plugin of plugins) visit(plugin, []);

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
				);
			}
			owners.set(value, record);
		}
	}
}

function createPluginDiagnostics(registry: PluginRuntimeRegistry): readonly PluginDiagnostics[] {
	return registry.records.map(record => ({
		name: record.plugin.name,
		index: record.index,
		imports: record.imports.map(plugin => plugin.name),
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
			.map(contribution => contribution.name),
	}));
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
	return (
		typeof value === 'object' &&
		value !== null &&
		'then' in value &&
		typeof (value as { then?: unknown }).then === 'function'
	);
}
