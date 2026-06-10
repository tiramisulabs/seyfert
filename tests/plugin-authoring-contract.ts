import {
	Client,
	type CommandMetadata,
	type CommandContext,
	createPlugin,
	createServiceKey,
	definePlugins,
	Middlewares,
	type MetadataMiddleware,
	type MiddlewareContext,
	type PluginContextOf,
	type PluginContextMapOf,
	type PluginExtensionOf,
	type PluginMiddlewaresMapOf,
	type PluginUsingClient,
	type RegisteredPluginMiddlewares,
	type RegisteredPluginServices,
	type Register,
	type RegisterPlugins,
	type ResolvedRegisteredMiddlewares,
	type ServiceKey,
	type SeyfertPlugin,
	type SeyfertPluginApi,
	type SeyfertPluginOptions,
} from 'seyfert';

declare function expectType<T>(value: T): void;

class EconomyApi {
	addCoins(_userId: string, _amount: number) {}
}

class LedgerService {
	readBalance(_userId: string) {
		return 100;
	}
}

type AuthMiddleware = MiddlewareContext<{ userId: string }, CommandContext>;
type AuditMiddleware = MiddlewareContext<undefined, CommandContext>;

const ledgerKey = createServiceKey('ledger');

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
			expectType<unknown>(client.services.get(ledgerKey));
			return payload;
		});
		api.autocomplete.wrap(async ({ command, interaction, optionsResolver }, next) => {
			expectType<string | undefined>(command?.name);
			expectType<unknown>(interaction);
			expectType<string>(optionsResolver.fullCommandName);
			await next();
		});
		api.services.set(ledgerKey, () => new LedgerService());
		api.events.once('commandsLoaded', metadata => {
			expectType<number>(metadata.total);
		});
		api.events.onAny((name, ...payload) => {
			expectType<string>(name);
			expectType<unknown[]>(payload);
		});
		api.options.set({ allowedMentions: { parse: [] } });
	},
	setup(client) {
		expectType<boolean>(client.storage.connected);
		client.economy.addCoins('user', 1);
	},
});

const auth: SeyfertPlugin<{}, {}, readonly [], { auth: AuthMiddleware; audit: AuditMiddleware }> = createPlugin({
	name: 'auth',
	register(api) {
		api.middlewares.add('auth', (({ next }) => next({ userId: '1' })) as AuthMiddleware);
		api.middlewares.add('audit', (({ next }) => next()) as AuditMiddleware);
	},
});

const optionsPlugin: SeyfertPlugin = {
	name: 'options',
	options(current) {
		expectType<Readonly<SeyfertPluginOptions>>(current);
		return { allowedMentions: { parse: [] } };
	},
};

const plugins = definePlugins(economy, storage, auth, optionsPlugin);
const arrayPlugins = definePlugins([economy, storage]);
const emptyPlugins = definePlugins();

declare module 'seyfert' {
	interface Register extends RegisterPlugins<typeof plugins> {}

	interface RegisteredPluginServices {
		ledger: LedgerService;
	}
}

declare function commandContext(): CommandContext;
declare function authCommandContext(): CommandContext<{}, 'auth'>;

expectType<Register>({ plugins });
expectType<SeyfertPlugin<any, any, any>>(economy);
expectType<readonly [typeof economy, typeof storage, typeof auth, typeof optionsPlugin]>(plugins);
expectType<readonly [typeof economy, typeof storage]>(arrayPlugins);
expectType<readonly []>(emptyPlugins);
expectType<string>(storage.meta.label);
expectType<ServiceKey<LedgerService, 'ledger'>>(ledgerKey);
expectType<EconomyApi>({} as PluginExtensionOf<typeof economy>['economy']);
expectType<{ add(amount: number): void }>({} as PluginContextOf<typeof economy>['wallet']);
expectType<EconomyApi>({} as PluginUsingClient<typeof plugins>['economy']);
expectType<{ add(amount: number): void }>({} as PluginContextMapOf<typeof plugins>['wallet']);
expectType<AuthMiddleware>({} as PluginMiddlewaresMapOf<typeof plugins>['auth']);
expectType<AuthMiddleware>({} as RegisteredPluginMiddlewares['auth']);
expectType<{ auth: { userId: string } }>({} as CommandMetadata<'auth'>);
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

const client = new Client({ plugins });
client.economy.addCoins('user', 2);
const ledger = client.services.get(ledgerKey);
expectType<LedgerService | undefined>(ledger);
expectType<LedgerService>(client.services.require(ledgerKey));
expectType<LedgerService | undefined>(client.services.get('ledger'));
expectType<RegisteredPluginServices['ledger'] | undefined>(client.services.get('ledger'));

const ctx = commandContext();
ctx.client.economy.addCoins('user', 3);
ctx.wallet.add(3);
expectType<ReturnType<typeof Middlewares>>(Middlewares(['auth']));
// @ts-expect-error plugin middlewares must be registered before they can be referenced
Middlewares(['missing']);
expectType<{ userId: string }>(authCommandContext().metadata.auth);
