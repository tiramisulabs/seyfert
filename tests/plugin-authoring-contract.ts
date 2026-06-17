import {
	ApplicationCommandOptionType,
	BaseResource,
	type Cache,
	Client,
	Command,
	ComponentCommand,
	type CommandMetadata,
	type CommandContext,
	createMiddleware,
	definePlugin,
	createPlugin,
	createSharedKey,
	definePlugins,
	GatewayIntentBits,
	GatewayOpcodes,
	type GatewayDispatchPayload,
	type InferMiddlewares,
	Middlewares,
	middlewares,
	type GatewaySendPayload,
	type GuildMemberStructure,
	type GuildRoleStructure,
	type MessageStructure,
	type MetadataMiddleware,
	type MiddlewareContext,
	type PluginContextOf,
	type PluginContextInteraction,
	type PluginContextMapOf,
	type PluginDiagnosticCode,
	type PluginExtensionOf,
	type PluginHandlerKind,
	type PluginMiddlewaresMapOf,
	type PluginCommandObserver,
	type PluginCommandObserverContext,
	PluginOrder,
	type PluginOrderOpt,
	type SeyfertPluginHooks,
	type PluginUsingClient,
	type RegisteredPluginMiddlewares,
	type RegisteredPluginShared,
	type ResolvedRegisteredMiddlewares,
	type OptionResolvedWithValue,
	type SharedKey,
	type SeyfertPlugin,
	type SeyfertPluginApi,
	type SeyfertPluginOptions,
	type SemverRange,
	type ShardManager,
	config,
	ModalCommand,
	type WebhookMessageStructure,
} from 'seyfert';
import type { MakePresent, MakeRequired, PickPresent, PickRequired } from '../lib/common';

declare function expectType<T>(value: T): void;
type IsAny<T> = 0 extends 1 & T ? true : false;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
	? (<T>() => T extends B ? 1 : 2) extends <T>() => T extends A ? 1 : 2
		? true
		: false
	: false;

type PresentFixture = {
	flag?: boolean;
	count?: 0 | 1;
	text?: '' | 'x';
	big?: 0n | 1n;
	nil?: null | 'ok';
};

type PresentFixtureAll = MakePresent<PresentFixture, 'flag' | 'count' | 'text' | 'big' | 'nil'>;
expectType<true>(true as Equal<PresentFixtureAll['flag'], boolean>);
expectType<true>(true as Equal<PresentFixtureAll['count'], 0 | 1>);
expectType<true>(true as Equal<PresentFixtureAll['text'], '' | 'x'>);
expectType<true>(true as Equal<PresentFixtureAll['big'], 0n | 1n>);
expectType<true>(true as Equal<PresentFixtureAll['nil'], 'ok'>);

type PickPresentFixture = PickPresent<PresentFixture, 'flag' | 'count' | 'text' | 'big' | 'nil'>;
expectType<true>(true as Equal<PickPresentFixture['flag'], boolean>);
expectType<true>(true as Equal<PickPresentFixture['count'], 0 | 1>);
expectType<true>(true as Equal<PickPresentFixture['text'], '' | 'x'>);
expectType<true>(true as Equal<PickPresentFixture['big'], 0n | 1n>);
expectType<true>(true as Equal<PickPresentFixture['nil'], 'ok'>);
expectType<true>(true as Equal<MakeRequired<{ flag?: boolean }, 'flag'>['flag'], true>);
expectType<true>(true as Equal<PickRequired<{ flag?: boolean }, 'flag'>['flag'], true | undefined>);
expectType<true>(true as Equal<OptionResolvedWithValue['value'], string | number | boolean>);
const falseBooleanOption = {
	name: 'hidden',
	type: ApplicationCommandOptionType.Boolean,
	value: false,
	focused: false,
} satisfies OptionResolvedWithValue;
expectType<false>(falseBooleanOption.value);
expectType<false>(falseBooleanOption.focused);
expectType<true>(true as Equal<ShardManager['options']['debug'], boolean>);
expectType<true>(true as Equal<ShardManager['options']['intents'], number>);
expectType<true>(true as Equal<ReturnType<typeof config.bot>['intents'], number>);
expectType<true>(true as Equal<ReturnType<typeof config.http>['port'], number>);
expectType<true>(
	true as Equal<Awaited<ReturnType<GuildMemberStructure['roles']['highest']>>, GuildRoleStructure | undefined>,
);

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
		api.gateway.wrapPayload(({ client, payload, shardId }) => {
			expectType<number>(shardId);
			expectType<unknown>(client.shared.get(ledgerKey));
			return payload;
		}, { order: PluginOrder.After });
		const disposeRestObserver = api.rest.observe({
			onRequest(payload) {
				expectType<Readonly<{ method: 'GET' | 'DELETE' | 'PUT' | 'POST' | 'PATCH'; url: `/${string}` }>>(
					payload,
				);
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
		}, PluginOrder.Before);
		expectType<() => void>(disposeRestObserver);
		api.autocomplete.wrap(async ({ command, interaction, optionsResolver }, next) => {
			expectType<string | undefined>(command?.name);
			expectType<unknown>(interaction);
			expectType<string>(optionsResolver.fullCommandName);
			await next();
		}, { order: 1 });
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
		const disposeObserver = api.commands.observe({
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
		}, { order: PluginOrder.After });
		expectType<() => void>(disposeObserver);
		api.components.add(ContractComponent);
		api.components.add(ContractComponent, { override: true });
		api.components.remove('contract-component');
		api.modals.add(ContractModal);
		api.modals.add(ContractModal, { override: true });
		api.commands.add(new ContractCommand());
		api.components.add(new ContractComponent());
		api.modals.add(new ContractModal());
		api.handlers.create((Ctor, next, metadata) => {
			expectType<PluginHandlerKind>(metadata.kind);
			expectType<unknown>(Ctor);
			return next();
		}, { kinds: ['command', 'component', 'modal'], order: PluginOrder.Before });
		api.handlers.transform((instance, metadata) => {
			expectType<PluginHandlerKind>(metadata.kind);
			return instance;
		}, { kinds: ['command'], order: PluginOrder.After });
		api.modals.remove('contract-modal');
		const disposeCommandsLoaded = api.events.once('commandsLoaded', metadata => {
			expectType<number>(metadata.total);
		});
		expectType<() => void>(disposeCommandsLoaded);
		const disposeComponentsLoaded = api.events.on('componentsLoaded', metadata => {
			expectType<number>(metadata.total);
		}, { order: PluginOrder.Before });
		expectType<() => void>(disposeComponentsLoaded);
		const disposeAny = api.events.onAny((name, ...payload) => {
			expectType<string>(name);
			expectType<unknown[]>(payload);
		}, { order: PluginOrder.After });
		expectType<() => void>(disposeAny);
		const disposeErrors = api.events.onError((error, name) => {
			expectType<unknown>(error);
			expectType<string>(name);
		}, { order: PluginOrder.Before });
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
		const disposeReadyHook = api.hooks.tap('plugins:ready', client => {
			expectType<unknown>(client.plugins);
		}, { order: PluginOrder.After });
		expectType<() => void>(disposeReadyHook);
		api.hooks.tap('commands:beforeLoad', (client, dir) => {
			expectType<unknown>(client.commands);
			expectType<string | undefined>(dir);
		});
		api.hooks.tap('commands:afterLoad', metadata => {
			expectType<'commands'>(metadata.kind);
		});
		api.hooks.tap('components:afterLoad', metadata => {
			expectType<'components'>(metadata.kind);
		});
		api.hooks.tap('client:close', client => {
			expectType<unknown>(client.plugins);
		});
		api.hooks.tap('economy:refresh', ledger => {
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
		api.middlewares.add('combinedAudit', combinedAudit);
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
		api.hooks.tap('plugins:ready', client => {
			expectType<'combined-client'>(client.combinedClient.source);
		});
		api.hooks.tap('commands:beforeLoad', (client, dir) => {
			expectType<'combined-client'>(client.combinedClient.source);
			expectType<string | undefined>(dir);
		});
		api.hooks.tap('client:close', client => {
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
		return { allowedMentions: { parse: [] } };
	},
};

const configuredPlugin = definePlugin((options: { currency: 'coin' | 'gem' }) =>
	createPlugin({
		name: 'configured',
		client: {
			configuredEconomy: () => ({ currency: options.currency }),
		},
	}),
)({ currency: 'coin' });
expectType<'coin' | 'gem'>({} as PluginExtensionOf<typeof configuredPlugin>['configuredEconomy']['currency']);

const defaultedPluginFactory = definePlugin({
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
const emptyPlugins = definePlugins();

declare module 'seyfert' {
	interface SeyfertRegistry {
		plugins: typeof plugins;
		client: Client<true>;
		middlewares: { localAudit: typeof combinedAudit };
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

expectType<Promise<void>>(commandContext().write({ content: 'Done!' }));
expectType<Promise<void>>(commandContext().editOrReply({ content: 'Done!' }));
expectType<Promise<void>>(commandContext().write({ content: 'Done!' }, false));
expectType<Promise<void>>(commandContext().editOrReply({ content: 'Done!' }, false));
expectType<Promise<WebhookMessageStructure>>(commandContext().write({ content: 'Done!' }, true));
expectType<Promise<WebhookMessageStructure>>(commandContext().editOrReply({ content: 'Done!' }, true));

expectType<SeyfertPlugin<any, any, any, any>>(economy);
// @ts-expect-error SeyfertPlugin has only four generic slots
type NoFifthPluginSlot = SeyfertPlugin<{}, {}, readonly [], {}, {}>;
expectType<readonly [typeof economy, typeof storage, typeof auth, typeof combinedAtomic, typeof combinedImport, typeof optionsPlugin]>(plugins);
expectType<readonly [typeof configuredPlugin, typeof defaultedPlugin, typeof capabilityRequirementPlugin]>(localPlugins);
expectType<readonly [typeof economy, typeof storage, typeof combinedAtomic]>(arrayPlugins);
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
({} as CommandMetadata<'audit'>).audit;
// @ts-expect-error middlewares without metadata payload are omitted even when mixed with payload middlewares
({} as CommandMetadata<'auth' | 'audit'>).audit;
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
client.economy.addCoins('user', 2);
const ledger = client.shared.get(ledgerKey);
expectType<LedgerService | undefined>(ledger);
expectType<LedgerService>(client.shared.unwrap(ledgerKey));
expectType<LedgerService | undefined>(client.shared.get('ledger'));
expectType<RegisteredPluginShared['ledger'] | undefined>(client.shared.get('ledger'));

const localClient = new Client({ plugins: localPlugins });
expectType<'coin' | 'gem'>(localClient.configuredEconomy.currency);
expectType<string>(localClient.defaultedConfig.prefix);

declare const explicitLocalClient: Client<typeof localPlugins>;
expectType<'coin' | 'gem'>(explicitLocalClient.configuredEconomy.currency);
expectType<boolean>(explicitLocalClient.defaultedConfig.enabled);

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
