import {
	type AllChannels,
	type AllGuildChannels,
	type AllNamedChannels,
	type APIEmbed,
	ApiHandler,
	type ApiHandlerOptions,
	type ApiRequestOptions,
	type Attachment,
	type BaseChannelStructure,
	type BaseGuildChannelStructure,
	BaseResource,
	type Cache,
	type CallbackEventHandler,
	Client,
	type ClientMiddlewares,
	type CollectorRunParameters,
	Collectors,
	Command,
	type CommandContext,
	type CommandMetadata,
	ComponentCommand,
	type ComponentContext,
	createMiddleware,
	createPlugin,
	createPluginFactory,
	createSharedKey,
	type DirectoryChannelStructure,
	type DMChannelStructure,
	definePlugins,
	Embed,
	type EntryPointContext,
	type GatewayDispatchPayload,
	GatewayIntentBits,
	GatewayOpcodes,
	type GatewaySendPayload,
	type GroupDMChannelStructure,
	type GuildMemberStructure,
	type GuildRoleStructure,
	type InferMiddlewares,
	type InteractionGuildMemberStructure,
	type MenuCommandContext,
	type MessageStructure,
	type MetadataMiddleware,
	type MiddlewareContext,
	Middlewares,
	ModalCommand,
	type ModalContext,
	type ModalSubmitInteraction,
	middlewares,
	type ParseClient,
	type PluginCommandObserver,
	type PluginCommandObserverContext,
	type PluginContextInteraction,
	type PluginContextMapOf,
	type PluginContextOf,
	type PluginDiagnosticCode,
	type PluginExtensionOf,
	type PluginGatewayDispatchInterceptor,
	type PluginGatewayDispatchMeta,
	type PluginGatewayDispatchNext,
	type PluginHandlerKind,
	type PluginMiddlewaresMapOf,
	PluginOrder,
	type PluginOrderOpt,
	type PluginUsingClient,
	PresenceUpdateStatus,
	type RegisteredPluginMiddlewares,
	type RegisteredPluginShared,
	type ResolvedChannel,
	type ResolvedRegisteredMiddlewares,
	type RestArgumentsRequiredQuery,
	type ReturnCache,
	type SemverRange,
	type SeyfertPlugin,
	type SeyfertPluginApi,
	type SeyfertPluginHooks,
	type SeyfertPluginOptions,
	type SharedKey,
	type StringSelectMenuInteraction,
	type UserStructure,
	type VoiceChannelStructure,
	type WebhookMessageStructure,
	WorkerManager,
} from 'seyfert';
import type { ComponentInteractionMessageUpdate, ModalCreateBodyRequest } from '../lib/common';
import type { ShardManagerOptions, WorkerManagerOptions } from '../lib/websocket/discord/shared';
import type { ManagerAllowConnect, ManagerAllowConnectResharding } from '../lib/websocket/discord/workermanager';

declare function expectType<T>(value: T): void;
type IsAny<T> = 0 extends 1 & T ? true : false;
type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? (<T>() => T extends B ? 1 : 2) extends <T>() => T extends A ? 1 : 2
			? true
			: false
		: false;

class EconomyApi {
	addCoins(_userId: string, _amount: number) {}
}

class LedgerService {
	readBalance(_userId: string) {
		return 100;
	}
}

class QueuesRegistry {
	readonly kind = 'queues' as const;
}

class CooldownManager {
	readonly kind = 'cooldown' as const;
}

class ContractCommand extends Command {
	name = 'contract';
	description = 'Contract';
	run() {}
}

class ContractComponent extends ComponentCommand {
	componentType = 'Button' as const;
	customId = 'contract-component';
	run() {}
}

class ContractModal extends ModalCommand {
	customId = 'contract-modal';
	run() {}
}

type CommandsLoadedCallbackParams = Parameters<CallbackEventHandler['commandsLoaded']>;

class ContractCacheResource extends BaseResource<{ id: string }, { id: string }> {
	namespace = 'contract-cache';
}

type AuthMiddleware = MiddlewareContext<{ userId: string }, CommandContext>;
type AuditMiddleware = MiddlewareContext<undefined, CommandContext>;

const ledgerKey = createSharedKey('ledger');
const combinedSharedKey = createSharedKey<{ fromClient: 'combined-client' }>()('combined-shared');
const functionSharedKey = createSharedKey<() => 'shared-fn'>()('shared-fn');
const heartbeatPayload: GatewaySendPayload = { op: GatewayOpcodes.Heartbeat, d: null };
expectType<GatewaySendPayload>(heartbeatPayload);
expectType<number>(GatewayIntentBits.Guilds);
expectType<PluginOrderOpt>(PluginOrder.Before);
expectType<PluginOrderOpt>(PluginOrder.After);
expectType<PluginOrderOpt>(10);
expectType<PluginDiagnosticCode>('unknown-intent-bits');

type PluginContextIncludesMessages = MessageStructure extends PluginContextInteraction ? true : false;
expectType<true>(true as PluginContextIncludesMessages);

const workerManagerInfo = {
	session_start_limit: {
		max_concurrency: 1,
		remaining: 1000,
		reset_after: 0,
		total: 1000,
	},
	shards: 1,
	url: 'wss://gateway.discord.gg',
};

const gatewayPresence = {
	activities: [],
	afk: false,
	since: null,
	status: PresenceUpdateStatus.Online,
} satisfies ReturnType<NonNullable<ShardManagerOptions['presence']>>;

const standaloneShardPresence = ((_shardId: number) => gatewayPresence) satisfies NonNullable<
	ShardManagerOptions['presence']
>;

expectType<NonNullable<ShardManagerOptions['presence']>>(standaloneShardPresence);

// @ts-expect-error standalone ShardManager presence no longer receives a worker id.
expectType<NonNullable<ShardManagerOptions['presence']>>((_shardId: number, _workerId: number) => gatewayPresence);

expectType<NonNullable<WorkerManagerOptions['presence']>>((_shardId: number, _workerId: number) => gatewayPresence);

const workerAllowConnectWithoutPresence = {
	type: 'ALLOW_CONNECT',
	shardId: 0,
} satisfies ManagerAllowConnect;
expectType<ManagerAllowConnect>(workerAllowConnectWithoutPresence);

const workerAllowConnectWithUndefinedPresence = {
	type: 'ALLOW_CONNECT',
	shardId: 0,
	presence: undefined,
} satisfies ManagerAllowConnect;
expectType<ManagerAllowConnect>(workerAllowConnectWithUndefinedPresence);

const workerAllowConnectReshardingWithoutPresence = {
	type: 'ALLOW_CONNECT_RESHARDING',
	shardId: 0,
} satisfies ManagerAllowConnectResharding;
expectType<ManagerAllowConnectResharding>(workerAllowConnectReshardingWithoutPresence);

const workerAllowConnectReshardingWithUndefinedPresence = {
	type: 'ALLOW_CONNECT_RESHARDING',
	shardId: 0,
	presence: undefined,
} satisfies ManagerAllowConnectResharding;
expectType<ManagerAllowConnectResharding>(workerAllowConnectReshardingWithUndefinedPresence);

const customWorkerManagerOptions = {
	mode: 'custom',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
	adapter: {
		postMessage() {},
		spawn() {},
	},
} satisfies WorkerManagerOptions;
expectType<WorkerManagerOptions>(customWorkerManagerOptions);
new WorkerManager(customWorkerManagerOptions);

type CustomWorkerManagerRuntimeOptions = Extract<WorkerManager['options'], { mode: 'custom' }>;
expectType<CustomWorkerManagerRuntimeOptions['workerEnv']>(undefined);

const customWorkerManagerOptionsWithPath = {
	mode: 'custom',
	path: 'worker.js',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
	adapter: {
		postMessage() {},
		spawn() {},
	},
} satisfies WorkerManagerOptions;
expectType<WorkerManagerOptions>(customWorkerManagerOptionsWithPath);
new WorkerManager(customWorkerManagerOptionsWithPath);

const threadedWorkerManagerOptions = {
	mode: 'threads',
	path: 'worker.js',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
	workerEnv: {
		DATABASE_URL: 'postgres://localhost/seyfert',
	},
} satisfies WorkerManagerOptions;
expectType<WorkerManagerOptions>(threadedWorkerManagerOptions);
new WorkerManager(threadedWorkerManagerOptions);

type NativeWorkerManagerRuntimeOptions = Exclude<WorkerManager['options'], { mode: 'custom' }>;
expectType<NativeWorkerManagerRuntimeOptions['workerEnv']>(undefined);

const defaultThreadedWorkerManagerOptions = {
	path: 'worker.js',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
} satisfies WorkerManagerOptions;
expectType<WorkerManagerOptions>(defaultThreadedWorkerManagerOptions);
new WorkerManager(defaultThreadedWorkerManagerOptions);

const clusteredWorkerManagerOptions = {
	mode: 'clusters',
	path: 'worker.js',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
	workerEnv: {
		DATABASE_URL: 'postgres://localhost/seyfert',
	},
} satisfies WorkerManagerOptions;
expectType<WorkerManagerOptions>(clusteredWorkerManagerOptions);
new WorkerManager(clusteredWorkerManagerOptions);

expectType<WorkerManagerOptions>({
	mode: 'threads',
	path: 'worker.js',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
	workerEnv: {
		// @ts-expect-error Worker environment values must be strings.
		PORT: 3000,
	},
});

// @ts-expect-error custom worker mode requires an adapter.
expectType<WorkerManagerOptions>({
	mode: 'custom',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
});

// @ts-expect-error thread worker mode requires a worker path.
expectType<WorkerManagerOptions>({
	mode: 'threads',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
});

// @ts-expect-error cluster worker mode requires a worker path.
expectType<WorkerManagerOptions>({
	mode: 'clusters',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
});

const storage = createPlugin({
	name: 'storage',
	meta: { label: 'primary' },
	client: {
		storage: () => ({ connected: true }),
	},
});

const queuesRegistry = new QueuesRegistry();
const queuesPlugin = createPlugin({
	name: '@slipher/queues',
	registry: queuesRegistry,
	client: {
		queues: () => queuesRegistry,
	},
});

const cooldownManager = new CooldownManager();
const cooldownPlugin = createPlugin({
	name: '@slipher/cooldowns',
	manager: cooldownManager,
});

createPlugin({
	name: 'invalid-reserved-extra',
	// @ts-expect-error reserved lifecycle fields keep the Seyfert plugin contract
	setup: 'not-a-function',
});

const economy = createPlugin({
	name: 'economy',
	imports: [storage],
	requires: ['plugin:storage', { req: 'plugin:cache', optional: true }],
	client: {
		economy: () => new EconomyApi(),
	},
	ctx: {
		wallet: () => ({
			add(amount: number) {
				expectType<number>(amount);
			},
		}),
	},
	register(api) {
		expectType<SeyfertPluginApi>(api);
		expectType<boolean>(api.has('plugin:storage'));
		api.gateway.addIntents('Guilds');
		api.gateway.wrapSendPayload(
			({ client, payload, shardId }) => {
				expectType<number>(shardId);
				expectType<unknown>(client.shared.get(ledgerKey));
				return payload;
			},
			{ order: PluginOrder.After },
		);
		// @ts-expect-error use gateway.wrapSendPayload for outbound gateway payloads
		api.gateway.wrapPayload(({ payload }) => payload);
		const disposeDispatchInterceptor = api.gateway.onDispatch(
			(packet, next, meta) => {
				expectType<GatewayDispatchPayload>(packet);
				expectType<PluginGatewayDispatchNext>(next);
				expectType<PluginGatewayDispatchMeta>(meta);
				return next(packet);
			},
			{ order: PluginOrder.Before },
		);
		expectType<() => void>(disposeDispatchInterceptor);
		expectType<PluginGatewayDispatchInterceptor>((packet, next, meta) => {
			expectType<GatewayDispatchPayload>(packet);
			expectType<number>(meta.shardId);
			return next();
		});
		const disposeRestObserver = api.rest.observe(
			{
				onRequest(payload) {
					expectType<Readonly<{ method: 'GET' | 'DELETE' | 'PUT' | 'POST' | 'PATCH'; url: `/${string}` }>>(payload);
				},
				onSuccess(payload) {
					expectType<Response>(payload.response);
				},
				onFail(payload) {
					expectType<unknown>(payload.error);
					expectType<number | undefined>(payload.statusCode);
				},
				onRatelimit(payload) {
					expectType<Response>(payload.response);
				},
			},
			{ order: PluginOrder.Before },
		);
		// @ts-expect-error rest observer order is passed with an options object
		api.rest.observe({}, PluginOrder.Before);
		expectType<() => void>(disposeRestObserver);
		api.autocomplete.wrap(
			async ({ command, interaction, optionsResolver }, next) => {
				expectType<string | undefined>(command?.name);
				expectType<unknown>(interaction);
				expectType<string>(optionsResolver.fullCommandName);
				await next();
			},
			{ order: 1 },
		);
		api.shared.set(ledgerKey, () => new LedgerService(), {
			dispose(value) {
				expectType<LedgerService>(value);
			},
			override: true,
		});
		api.shared.remove(ledgerKey, 'legacy-ledger');
		api.commands.add(ContractCommand);
		api.commands.add(ContractCommand, { override: true });
		api.commands.add(ContractCommand, { guilds: ['guild-1'] });
		const disposeObserver = api.commands.observe(
			{
				onBeforeOptions(context) {
					expectType<CommandContext>(context);
				},
				onMiddlewaresError(context, error, metadata) {
					expectType<PluginCommandObserverContext>(context);
					expectType<string>(error);
					expectType<{ middleware: string; scope: 'global' | 'command' }>(metadata);
				},
				onRunError(context, error) {
					expectType<PluginCommandObserverContext>(context);
					expectType<unknown>(error);
				},
				onInternalError(client, command, error) {
					expectType<unknown>(client);
					expectType<unknown>(command);
					expectType<unknown>(error);
				},
			},
			{ order: PluginOrder.After },
		);
		expectType<() => void>(disposeObserver);
		api.components.add(ContractComponent);
		api.components.add(ContractComponent, { override: true });
		api.components.remove('contract-component');
		api.modals.add(ContractModal);
		api.modals.add(ContractModal, { override: true });
		api.commands.add(new ContractCommand());
		api.components.add(new ContractComponent());
		api.modals.add(new ContractModal());
		api.handlers.construct(
			(Ctor, next, metadata) => {
				expectType<PluginHandlerKind>(metadata.kind);
				expectType<unknown>(Ctor);
				return next();
			},
			{ kinds: ['command', 'component', 'modal'], order: PluginOrder.Before },
		);
		// @ts-expect-error handlers.create was removed before release
		api.handlers.create((_Ctor, next) => next());
		api.handlers.transform(
			(instance, metadata) => {
				expectType<PluginHandlerKind>(metadata.kind);
				return instance;
			},
			{ kinds: ['command'], order: PluginOrder.After },
		);
		api.modals.remove('contract-modal');
		const disposeCommandsLoaded = api.events.once('commandsLoaded', metadata => {
			expectType<number>(metadata.total);
		});
		expectType<() => void>(disposeCommandsLoaded);
		const disposeComponentsLoaded = api.events.on(
			'componentsLoaded',
			metadata => {
				expectType<number>(metadata.total);
			},
			{ order: PluginOrder.Before },
		);
		expectType<() => void>(disposeComponentsLoaded);
		const disposeAny = api.events.onAny(
			(name, ...payload) => {
				expectType<string>(name);
				expectType<unknown[]>(payload);
			},
			{ order: PluginOrder.After },
		);
		expectType<() => void>(disposeAny);
		const disposeErrors = api.events.onError(
			(error, name) => {
				expectType<unknown>(error);
				expectType<string>(name);
			},
			{ order: PluginOrder.Before },
		);
		expectType<() => void>(disposeErrors);
		api.events.on('commandsLoaded', (metadata, client) => {
			expectType<void | Promise<void>>(
				client.events.emit('commandsLoaded', {
					kind: metadata.kind,
					total: metadata.total,
					items: metadata.items,
					plugin: metadata.plugin,
				}),
			);
		});
		expectType<void | Promise<void>>(
			new Client({ plugins: [] }).events.emit('commandsLoaded', {
				kind: 'commands',
				total: 0,
				items: [],
				plugin: { total: 0, sources: {} },
			}),
		);
		expectType<void>(api.langs.contribute('en-US', { balance: 'Balance' }, { prefix: 'plugins.economy' }));
		api.cache.resource('contractCache', ContractCacheResource, {
			intents: ['Guilds', GatewayIntentBits.GuildMembers],
			onPacket(event, cache) {
				expectType<GatewayDispatchPayload>(event);
				expectType<Cache>(cache);
			},
		});
		const disposeReadyHook = api.hooks.on(
			'plugins:ready',
			client => {
				expectType<unknown>(client.plugins);
			},
			{ order: PluginOrder.After },
		);
		expectType<() => void>(disposeReadyHook);
		// @ts-expect-error hooks.tap was removed before release
		api.hooks.tap('plugins:ready', () => {});
		const disposeSetupHook = api.hooks.on('plugins:setupComplete', client => {
			expectType<unknown>(client.plugins);
		});
		expectType<() => void>(disposeSetupHook);
		api.hooks.on('commands:beforeLoad', (client, dir) => {
			expectType<unknown>(client.commands);
			expectType<string | undefined>(dir);
		});
		api.hooks.on('commands:afterLoad', metadata => {
			expectType<'commands'>(metadata.kind);
		});
		api.hooks.on('components:afterLoad', metadata => {
			expectType<'components'>(metadata.kind);
		});
		api.hooks.on('client:close', client => {
			expectType<unknown>(client.plugins);
		});
		api.hooks.on('economy:refresh', ledger => {
			expectType<LedgerService>(ledger);
		});
		api.options.set({ allowedMentions: { parse: [] } });
	},
	setup(client) {
		expectType<boolean>(client.storage.connected);
		client.economy.addCoins('user', 1);
	},
});

createPlugin({
	name: 'missing-langs-prefix',
	register(api) {
		// @ts-expect-error locale prefix is required for lang contributions
		api.langs.contribute('en-US', { balance: 'Balance' });
	},
});

const observer: PluginCommandObserver = {
	onAfterRun(context, error) {
		expectType<PluginCommandObserverContext>(context);
		expectType<unknown | undefined>(error);
	},
};
expectType<PluginCommandObserver>(observer);

const auth: SeyfertPlugin<{}, {}, readonly [], { auth: AuthMiddleware; audit: AuditMiddleware }> = createPlugin({
	name: 'auth',
	register(api) {
		api.middlewares.add('auth', (({ next }) => next({ userId: '1' })) as AuthMiddleware);
		api.middlewares.add('audit', (({ next }) => next()) as AuditMiddleware);
		// @ts-expect-error known middleware names must use their declared payload
		api.middlewares.add('auth', (({ next }) => next()) as AuditMiddleware);
	},
});

const combinedImport = createPlugin({
	name: 'combined-import',
	client: {
		importedCounter() {
			return { count: 1 as const };
		},
	},
	ctx: {
		importedCtx(_interaction, client) {
			expectType<1>(client.importedCounter.count);
			return { importedCtx: true as const };
		},
	},
});

const combinedAudit = createMiddleware<{ auditId: string }, CommandContext>(({ context, next }) => {
	expectType<CommandContext>(context);
	next({ auditId: 'audit' });
	// @ts-expect-error audit middleware metadata requires a string id
	next({ auditId: 1 });
});

const combinedAtomic = createPlugin({
	name: 'combined-atomic',
	imports: [combinedImport],
	meta: { kind: 'atomic', stage: 2 } as const,
	client: {
		combinedClient(client) {
			expectType<1>(client.importedCounter.count);
			// @ts-expect-error client factories see imports, not their own plugin extensions
			expectType<never>(client.combinedClient);
			// @ts-expect-error imported extension does not expose missing members
			expectType<never>(client.importedCounter.missing);
			return { source: 'combined-client' as const, importedCount: client.importedCounter.count };
		},
	},
	ctx: {
		combinedCtx(interaction, client) {
			expectType<PluginContextInteraction>(interaction);
			expectType<1>(client.importedCounter.count);
			expectType<'combined-client'>(client.combinedClient.source);
			// @ts-expect-error own ctx extension is not available while constructing ctx fragments
			expectType<never>(client.combinedCtx);
			return { source: client.combinedClient.source, importedCount: client.importedCounter.count };
		},
	},
	middlewares: {
		combinedAudit,
		combinedEmpty: createMiddleware<undefined, CommandContext>(({ next }) => next()),
	},
	globalMiddlewares: ['combinedAudit'],
	register(api) {
		api.shared.set(combinedSharedKey, client => {
			expectType<1>(client.importedCounter.count);
			expectType<'combined-client'>(client.combinedClient.source);
			return { fromClient: client.combinedClient.source };
		});
		api.shared.set(
			functionSharedKey,
			client => {
				expectType<1>(client.importedCounter.count);
				expectType<'combined-client'>(client.combinedClient.source);
				return () => 'shared-fn' as const;
			},
			{
				async dispose(value) {
					expectType<() => 'shared-fn'>(value);
				},
			},
		);
		// @ts-expect-error shared function values must be returned from a factory
		api.shared.set(functionSharedKey, () => 'shared-fn');
		api.hooks.on('plugins:ready', client => {
			expectType<'combined-client'>(client.combinedClient.source);
		});
		api.hooks.on('commands:beforeLoad', (client, dir) => {
			expectType<'combined-client'>(client.combinedClient.source);
			expectType<string | undefined>(dir);
		});
		api.hooks.on('client:close', client => {
			expectType<'combined-client'>(client.combinedClient.source);
		});
	},
	setup(client, api) {
		expectType<1>(client.importedCounter.count);
		expectType<'combined-client'>(client.combinedClient.source);
		expectType<boolean | undefined>(api?.has('plugin:combined-import'));
		// @ts-expect-error setup client extension keeps exact shape
		expectType<never>(client.combinedClient.missing);
	},
	teardown(client, api) {
		expectType<1>(client.importedCounter.count);
		expectType<'combined-client'>(client.combinedClient.source);
		expectType<boolean | undefined>(api?.shared.has(combinedSharedKey));
		expectType<boolean | undefined>(api?.has('plugin:combined-import'));
		api?.diagnostics.warn('closing');
		// @ts-expect-error teardown API is read-only except diagnostics
		api?.commands.add(ContractCommand);
	},
});

const noMetaPlugin = createPlugin({
	name: 'no-meta',
});
// @ts-expect-error plugins without meta should not expose a meta property
expectType<never>(noMetaPlugin.meta);

const optionsPlugin: SeyfertPlugin = {
	name: 'options',
	options(current) {
		expectType<Readonly<SeyfertPluginOptions>>(current);
		return {
			allowedMentions: { parse: [] },
			logger: {
				active: false,
				logLevel: 3,
				name: 'plugin',
				saveOnFile: false,
			},
		};
	},
};

const configuredPlugin = ((options: { currency: 'coin' | 'gem' }) =>
	createPlugin({
		name: 'configured',
		client: {
			configuredEconomy: () => ({ currency: options.currency }),
		},
	}))({ currency: 'coin' });
expectType<'coin' | 'gem'>({} as PluginExtensionOf<typeof configuredPlugin>['configuredEconomy']['currency']);

const defaultedPluginFactory = createPluginFactory({
	defaults: { prefix: 'default', enabled: true },
	validate(options) {
		expectType<string>(options.prefix);
		expectType<boolean>(options.enabled);
	},
	factory(options) {
		return createPlugin({
			name: 'defaulted-configured',
			client: {
				defaultedConfig: () => ({ prefix: options.prefix, enabled: options.enabled }),
			},
		});
	},
});
const defaultedPlugin = defaultedPluginFactory();
const overriddenDefaultedPlugin = defaultedPluginFactory({ prefix: 'override' });
expectType<string>({} as PluginExtensionOf<typeof defaultedPlugin>['defaultedConfig']['prefix']);
expectType<boolean>({} as PluginExtensionOf<typeof overriddenDefaultedPlugin>['defaultedConfig']['enabled']);

const range: SemverRange = '^1.2.0';
const capabilityRequirementPlugin = createPlugin({
	name: 'capability-requirement',
	instanceId: 'primary',
	requires: [
		{ req: 'plugin:storage', range },
		{ req: 'plugin:storage#primary', range: '>=1.0.0', optional: true },
		{ capability: ledgerKey },
		{ capability: combinedSharedKey, optional: true },
	],
});

const plugins = definePlugins(economy, storage, auth, combinedAtomic, combinedImport, optionsPlugin);
const localPlugins = definePlugins(configuredPlugin, defaultedPlugin, capabilityRequirementPlugin);
const arrayPlugins = definePlugins([economy, storage, combinedAtomic]);
const transitiveOnlyPlugins = definePlugins(combinedAtomic);
const emptyPlugins = definePlugins();

declare module 'seyfert' {
	interface SeyfertRegistry {
		plugins: typeof plugins;
		client: ParseClient<Client<true>>;
		middlewares: { localAudit: typeof combinedAudit };
		langs: {
			commands: {
				groups: {
					admin: {
						name: string;
						description: string;
					};
				};
			};
		};
	}

	interface RegisteredPluginShared {
		ledger: LedgerService;
	}

	interface SeyfertPluginHooks {
		'economy:refresh': [ledger: LedgerService];
	}
}

declare function commandContext(): CommandContext;
declare function authCommandContext(): CommandContext<{}, 'auth'>;
declare function componentContext(): ComponentContext;
declare function stringSelectComponentContext(): ComponentContext<'StringSelect', never, ['general', 'news']>;
declare function unionComponentContext(): ComponentContext<'Button' | 'StringSelect', never, ['general']>;
declare function modalContext(): ModalContext;
declare function menuCommandContext(): MenuCommandContext<any>;
declare function entryPointContext(): EntryPointContext;
declare const messageWithEmbeds: MessageStructure;
declare const rawApiEmbed: APIEmbed;
declare const modalBodyContract: ModalCreateBodyRequest;
declare const modalUpdateBodyContract: ComponentInteractionMessageUpdate;
declare const modalSubmitInteraction: ModalSubmitInteraction;
declare const collectorClient: Client;

expectType<Promise<void>>(commandContext().write({ content: 'Done!' }));
expectType<Promise<void>>(commandContext().write({ embeds: messageWithEmbeds.embeds }));
expectType<Promise<void>>(commandContext().write({ embeds: [new Embed(), rawApiEmbed] }));
expectType<Promise<void>>(commandContext().editOrReply({ content: 'Done!' }));
expectType<Promise<void>>(commandContext().write({ content: 'Done!' }, false));
expectType<Promise<void>>(commandContext().editOrReply({ content: 'Done!' }, false));
expectType<Promise<WebhookMessageStructure>>(commandContext().write({ content: 'Done!' }, true));
expectType<Promise<WebhookMessageStructure>>(commandContext().editOrReply({ content: 'Done!' }, true));
expectType<Promise<undefined>>(commandContext().modal(modalBodyContract));
expectType<Promise<ModalSubmitInteraction | null>>(commandContext().modal(modalBodyContract, { waitFor: 1_000 }));
expectType<true>(true as Equal<CommandContext['messageResponse'], undefined>);
expectType<MessageStructure>(componentContext().message);
expectType<Promise<undefined>>(modalContext().update(modalUpdateBodyContract));
expectType<Promise<WebhookMessageStructure>>(modalContext().update(modalUpdateBodyContract, true));
expectType<Promise<undefined>>(modalContext().deferUpdate());
expectType<Promise<undefined>>(modalSubmitInteraction.deferUpdate());
// @ts-expect-error ModalSubmitInteraction.deferUpdate no longer accepts withResponse.
modalSubmitInteraction.deferUpdate(true);
expectType<StringSelectMenuInteraction<['general', 'news']>>(stringSelectComponentContext().interaction);
expectType<['general', 'news']>(stringSelectComponentContext().interaction.values);
const maybeStringSelectContext = unionComponentContext();
if (maybeStringSelectContext.isStringSelectMenu()) {
	expectType<['general']>(maybeStringSelectContext.interaction.values);
}
const guildStringSelectContext = stringSelectComponentContext();
if (guildStringSelectContext.inGuild()) {
	expectType<['general', 'news']>(guildStringSelectContext.interaction.values);
}
collectorClient.collectors.create({
	event: 'messageCreate',
	filter(message) {
		expectType<MessageStructure>(message);
		return true;
	},
	run(message) {
		expectType<MessageStructure>(message);
	},
});
collectorClient.collectors.create({
	// @ts-expect-error collector events expose camelCase gateway event names only.
	event: 'MESSAGE_CREATE',
	filter() {
		return true;
	},
	run() {},
});
const exportedCollectorsContract = new Collectors();
expectType<Collectors>(exportedCollectorsContract);
expectType<MessageStructure>(undefined as never as CollectorRunParameters<'messageCreate'>);
expectType<CollectorRunParameters<'commandsLoaded'>>(undefined as never as [CommandsLoadedCallbackParams[0]]);
expectType<[CommandsLoadedCallbackParams[0]]>(undefined as never as CollectorRunParameters<'commandsLoaded'>);
// @ts-expect-error collector run parameters are keyed by camelCase event names.
type ScreamingCollectorRunParameters = CollectorRunParameters<'MESSAGE_CREATE'>;
// @ts-expect-error typo alias is intentionally not exported.
type TypoCollectorRunPameters = import('seyfert').CollectorRunPameters<'messageCreate'>;
type VoiceChannelStatusUpdatePayload = Parameters<CallbackEventHandler['voiceChannelStatusUpdate']>[0];
expectType<
	[
		status: {
			id: string;
			guildId: string;
			status?: string | null;
		},
		channel: VoiceChannelStructure | undefined,
	]
>(undefined as never as VoiceChannelStatusUpdatePayload);

expectType<ResolvedChannel[]>(modalContext().getChannels('channels', true));
expectType<ResolvedChannel[] | void>(modalContext().getChannels('channels'));
expectType<GuildRoleStructure[]>(modalContext().getRoles('roles', true));
expectType<GuildRoleStructure[] | void>(modalContext().getRoles('roles'));
expectType<UserStructure[]>(modalContext().getUsers('users', true));
expectType<UserStructure[] | void>(modalContext().getUsers('users'));
expectType<(UserStructure | GuildRoleStructure | InteractionGuildMemberStructure)[]>(
	modalContext().getMentionables('mentionables', true),
);
expectType<(UserStructure | GuildRoleStructure | InteractionGuildMemberStructure)[] | void>(
	modalContext().getMentionables('mentionables'),
);
expectType<string>(modalContext().getRadioValues('choice', true));
expectType<string | void>(modalContext().getRadioValues('choice'));
expectType<string[]>(modalContext().getCheckboxValues('checks', true));
expectType<string[] | void>(modalContext().getCheckboxValues('checks'));
expectType<boolean>(modalContext().getCheckbox('enabled', true));
expectType<boolean | void>(modalContext().getCheckbox('enabled'));
expectType<string | string[]>(modalContext().getInputValue('input', true));
expectType<string | string[] | undefined>(modalContext().getInputValue('input'));
expectType<Attachment[]>(modalContext().getFiles('files', true));
expectType<Attachment[] | undefined>(modalContext().getFiles('files'));

expectType<Promise<GuildMemberStructure | undefined>>(commandContext().fetchMember());
expectType<Promise<GuildMemberStructure | undefined>>(commandContext().fetchMember('flow'));
expectType<Promise<GuildMemberStructure | undefined>>(commandContext().fetchMember('rest'));
expectType<ReturnCache<GuildMemberStructure | undefined>>(commandContext().fetchMember('cache'));

type GuildCommandChannel = AllGuildChannels | BaseGuildChannelStructure;
type NamedChannel =
	| GuildCommandChannel
	| (GroupDMChannelStructure & { name: string })
	| (BaseChannelStructure & { name: string });
expectType<true>(true as Equal<AllNamedChannels, NamedChannel>);
expectType<true>(true as Equal<AllGuildChannels extends GuildCommandChannel ? true : false, true>);
expectType<true>(true as Equal<BaseGuildChannelStructure extends GuildCommandChannel ? true : false, true>);
expectType<true>(true as Equal<DMChannelStructure extends GuildCommandChannel ? true : false, false>);
expectType<true>(true as Equal<BaseChannelStructure extends GuildCommandChannel ? true : false, false>);
// @ts-expect-error AllEditableChannels duplicates the guild-channel contract and should not be exported.
type NoEditableChannelsAlias = import('seyfert').AllEditableChannels;
expectType<string>(undefined as never as DirectoryChannelStructure['name']);
expectType<string>(undefined as never as DirectoryChannelStructure['guildId']);

const maybeChannel = undefined as never as AllChannels;
// @ts-expect-error Use isNamed() for named channels or isGuild() for guild channels.
maybeChannel.isEditable();

if (maybeChannel.isNamed()) {
	expectType<AllNamedChannels>(maybeChannel);
	expectType<string>(maybeChannel.name);
}

if (maybeChannel.isGuild()) {
	expectType<GuildCommandChannel>(maybeChannel);
}

const guildCommandContext = commandContext();
if (guildCommandContext.inGuild()) {
	const channel = guildCommandContext.channel();
	expectType<true>(true as Equal<typeof channel, Promise<GuildCommandChannel>>);

	const cachedChannel = guildCommandContext.channel('cache');
	expectType<true>(true as Equal<typeof cachedChannel, ReturnCache<GuildCommandChannel>>);

	expectType<Promise<GuildMemberStructure>>(guildCommandContext.fetchMember());
	expectType<Promise<GuildMemberStructure>>(guildCommandContext.fetchMember('flow'));
	expectType<Promise<GuildMemberStructure>>(guildCommandContext.fetchMember('rest'));
	expectType<ReturnCache<GuildMemberStructure | undefined>>(guildCommandContext.fetchMember('cache'));
}

expectType<SeyfertPlugin<any, any, any, any>>(economy);
// @ts-expect-error SeyfertPlugin has only four generic slots
type NoFifthPluginSlot = SeyfertPlugin<{}, {}, readonly [], {}, {}>;
expectType<
	readonly [
		typeof economy,
		typeof storage,
		typeof auth,
		typeof combinedAtomic,
		typeof combinedImport,
		typeof optionsPlugin,
	]
>(plugins);
expectType<readonly [typeof configuredPlugin, typeof defaultedPlugin, typeof capabilityRequirementPlugin]>(
	localPlugins,
);
expectType<readonly [typeof economy, typeof storage, typeof combinedAtomic]>(arrayPlugins);
expectType<readonly [typeof combinedAtomic]>(transitiveOnlyPlugins);
expectType<readonly []>(emptyPlugins);
expectType<string>(storage.meta.label);
expectType<'atomic'>(combinedAtomic.meta.kind);
// @ts-expect-error plugins without meta should not expose a meta property
expectType<never>(noMetaPlugin.meta);
expectType<QueuesRegistry>(queuesPlugin.registry);
expectType<QueuesRegistry>({} as PluginExtensionOf<typeof queuesPlugin>['queues']);
expectType<CooldownManager>(cooldownPlugin.manager);
expectType<SharedKey<LedgerService, 'ledger'>>(ledgerKey);
expectType<SharedKey<{ fromClient: 'combined-client' }, 'combined-shared'>>(combinedSharedKey);
expectType<SharedKey<() => 'shared-fn', 'shared-fn'>>(functionSharedKey);
expectType<EconomyApi>({} as PluginExtensionOf<typeof economy>['economy']);
expectType<{ add(amount: number): void }>({} as PluginContextOf<typeof economy>['wallet']);
expectType<false>(false as IsAny<PluginExtensionOf<typeof combinedAtomic>['combinedClient']>);
expectType<false>(false as IsAny<PluginContextOf<typeof combinedAtomic>['combinedCtx']>);
expectType<'combined-client'>({} as PluginExtensionOf<typeof combinedAtomic>['combinedClient']['source']);
expectType<'combined-client'>({} as PluginContextOf<typeof combinedAtomic>['combinedCtx']['source']);
expectType<EconomyApi>({} as PluginUsingClient<typeof plugins>['economy']);
expectType<'combined-client'>({} as PluginUsingClient<typeof plugins>['combinedClient']['source']);
expectType<{ add(amount: number): void }>({} as PluginContextMapOf<typeof plugins>['wallet']);
expectType<'combined-client'>({} as PluginContextMapOf<typeof plugins>['combinedCtx']['source']);
expectType<AuthMiddleware>({} as PluginMiddlewaresMapOf<typeof plugins>['auth']);
expectType<typeof combinedAudit>({} as PluginMiddlewaresMapOf<typeof plugins>['combinedAudit']);
expectType<AuthMiddleware>({} as RegisteredPluginMiddlewares['auth']);
expectType<typeof combinedAudit>({} as RegisteredPluginMiddlewares['combinedAudit']);
expectType<{ auth: { userId: string } }>({} as CommandMetadata<'auth'>);
expectType<{ combinedAudit: { auditId: string } }>({} as CommandMetadata<'combinedAudit'>);
expectType<{ auth: { userId: string } }>({} as CommandMetadata<'auth' | 'audit'>);
expectType<{}>({} as CommandMetadata<'audit'>);
// @ts-expect-error middlewares without metadata payload are omitted from command metadata
(({}) as CommandMetadata<'audit'>).audit;
// @ts-expect-error middlewares without metadata payload are omitted even when mixed with payload middlewares
(({}) as CommandMetadata<'auth' | 'audit'>).audit;
expectType<{ userId: string }>({} as MetadataMiddleware<AuthMiddleware>);
expectType<{ userId: string }>({} as MetadataMiddleware<RegisteredPluginMiddlewares['auth']>);
expectType<{ userId: string }>({} as MetadataMiddleware<ResolvedRegisteredMiddlewares['auth']>);
expectType<AuthMiddleware>({} as ResolvedRegisteredMiddlewares['auth']);
expectType<[LedgerService]>({} as SeyfertPluginHooks['economy:refresh']);

const commandMiddlewares = middlewares('auth', 'combinedAudit');
expectType<true>(true as Equal<typeof commandMiddlewares, readonly ['auth', 'combinedAudit']>);
expectType<true>(true as Equal<InferMiddlewares<typeof commandMiddlewares>, 'auth' | 'combinedAudit'>);
expectType<{ auth: { userId: string }; combinedAudit: { auditId: string } }>(
	{} as CommandMetadata<typeof commandMiddlewares>,
);
expectType<ReturnType<typeof Middlewares>>(Middlewares(commandMiddlewares));
declare function typedMiddlewareCommandContext(): CommandContext<{}, InferMiddlewares<typeof commandMiddlewares>>;
expectType<{ userId: string }>(typedMiddlewareCommandContext().metadata.auth);
expectType<{ auditId: string }>(typedMiddlewareCommandContext().metadata.combinedAudit);
// @ts-expect-error middleware tuple helper only accepts registered middleware keys
middlewares('missing');

const client = new Client({ plugins });
const clientWithLoggerOptions = new Client({
	logger: {
		active: false,
		logLevel: 2,
		name: 'client',
		saveOnFile: false,
	},
});
expectType<Client>(clientWithLoggerOptions);
const disposeClientRestObserver = client.rest.observe({
	onRequest(payload) {
		expectType<Client>(payload.client);
		expectType<Readonly<ApiRequestOptions>>(payload.request);
	},
});
expectType<() => void>(disposeClientRestObserver);
const disposeApiHandlerObserver = new ApiHandler({ token: 'token' }).observe({
	onRequest(payload) {
		expectType<unknown>(payload.client);
	},
});
expectType<() => void>(disposeApiHandlerObserver);
expectType<ApiHandlerOptions>({ token: 'token' });
// @ts-expect-error REST lifecycle callbacks are assigned on ApiHandler, not constructor options.
expectType<ApiHandlerOptions>({ token: 'token', onRatelimit() {} });
expectType<RestArgumentsRequiredQuery<{ query: string }>>({ query: { query: 'seyfert' } });
// @ts-expect-error required query REST arguments must include query.
expectType<RestArgumentsRequiredQuery<{ query: string }>>({});
client.setServices({ middlewares: { localAudit: combinedAudit } });
client.setServices({
	middlewares: {
		auth: (({ next }) => next({ userId: '1' })) as AuthMiddleware,
		combinedAudit,
	},
});
// @ts-expect-error setServices middlewares only accepts registered middleware keys when the registry is typed
client.setServices({ middlewares: { missing: combinedAudit } });
// @ts-expect-error setServices preserves the registered middleware value type for each key
client.setServices({ middlewares: { auth: combinedAudit } });
const fallbackMiddlewares: ClientMiddlewares<{}> = {
	anyRuntimeMiddleware: (({ next }) => next(undefined)) as MiddlewareContext,
};
expectType<MiddlewareContext>(fallbackMiddlewares.anyRuntimeMiddleware);
// @ts-expect-error fallback middleware values must still be middleware functions
expectType<ClientMiddlewares<{}>>({ anyRuntimeMiddleware: 'not-a-middleware' });
client.economy.addCoins('user', 2);
const ledger = client.shared.get(ledgerKey);
expectType<LedgerService | undefined>(ledger);
expectType<LedgerService>(client.shared.unwrap(ledgerKey));
expectType<LedgerService | undefined>(client.shared.get('ledger'));
expectType<RegisteredPluginShared['ledger'] | undefined>(client.shared.get('ledger'));

const localClient = new Client({ plugins: localPlugins });
expectType<'coin' | 'gem'>(localClient.configuredEconomy.currency);
expectType<string>(localClient.defaultedConfig.prefix);
// @ts-expect-error local clients should not expose ambient registry plugins
expectType<never>(localClient.economy);

declare const explicitLocalClient: Client<typeof localPlugins>;
expectType<'coin' | 'gem'>(explicitLocalClient.configuredEconomy.currency);
expectType<boolean>(explicitLocalClient.defaultedConfig.enabled);
// @ts-expect-error explicit local clients should not expose ambient registry plugins
expectType<never>(explicitLocalClient.economy);

declare const transitiveClient: Client<typeof transitiveOnlyPlugins>;
expectType<1>(transitiveClient.importedCounter.count);
expectType<'combined-client'>(transitiveClient.combinedClient.source);

const ctx = commandContext();
ctx.client.economy.addCoins('user', 3);
ctx.wallet.add(3);
expectType<number>(ctx.client.gateway.latency);
expectType<typeof combinedAudit>({} as ResolvedRegisteredMiddlewares['localAudit']);
expectType<ReturnType<typeof Middlewares>>(Middlewares(['auth']));
expectType<ReturnType<typeof Middlewares>>(Middlewares(['combinedAudit']));
// @ts-expect-error plugin middlewares must be registered before they can be referenced
Middlewares(['missing']);
expectType<{ userId: string }>(authCommandContext().metadata.auth);
