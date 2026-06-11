import {
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
	Middlewares,
	type GatewaySendPayload,
	type MessageStructure,
	type MetadataMiddleware,
	type MiddlewareContext,
	type PluginContextOf,
	type PluginContextInteraction,
	type PluginContextMapOf,
	type PluginDiagnosticCode,
	type PluginExtensionOf,
	type PluginMiddlewaresMapOf,
	type PluginCommandObserver,
	type PluginCommandObserverContext,
	PluginOrder,
	type PluginOrderOpt,
	type SeyfertPluginHooks,
	type PluginUsingClient,
	type RegisteredPluginMiddlewares,
	type RegisteredPluginShared,
	type Register,
	type RegisterPlugins,
	type ResolvedRegisteredMiddlewares,
	type SharedKey,
	type SeyfertPlugin,
	type SeyfertPluginApi,
	type SeyfertPluginOptions,
	type SemverRange,
	ModalCommand,
} from 'seyfert';

declare function expectType<T>(value: T): void;
type IsAny<T> = 0 extends 1 & T ? true : false;

class EconomyApi {
	addCoins(_userId: string, _amount: number) {}
}

class LedgerService {
	readBalance(_userId: string) {
		return 100;
	}
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
		expectType<Promise<void>>(
			api.events.emit('commandsLoaded', {
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

const invalidPlugin = createPlugin({
	name: 'invalid',
	// @ts-expect-error unknown plugin fields are rejected
	notAPluginField: true,
});
expectType<string>(invalidPlugin.name);

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
	interface Register extends RegisterPlugins<typeof plugins> {}

	interface RegisteredPluginShared {
		ledger: LedgerService;
	}

	interface SeyfertPluginHooks {
		'economy:refresh': [ledger: LedgerService];
	}
}

declare function commandContext(): CommandContext;
declare function authCommandContext(): CommandContext<{}, 'auth'>;

expectType<Register>({ plugins });
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
expectType<ReturnType<typeof Middlewares>>(Middlewares(['auth']));
expectType<ReturnType<typeof Middlewares>>(Middlewares(['combinedAudit']));
// @ts-expect-error plugin middlewares must be registered before they can be referenced
Middlewares(['missing']);
expectType<{ userId: string }>(authCommandContext().metadata.auth);
