import {
	Client,
	type CommandContext,
	createPlugin,
	definePlugins,
	type PluginContextOf,
	type PluginExtensionOf,
	type Register,
	type SeyfertPlugin,
	type SeyfertPluginApi,
} from 'seyfert';

declare function expectType<T>(value: T): void;

class EconomyApi {
	addCoins(_userId: string, _amount: number) {}
}

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
		api.options.set({ allowedMentions: { parse: [] } });
	},
	setup(client) {
		expectType<boolean>(client.storage.connected);
		client.economy.addCoins('user', 1);
	},
});

const plugins = definePlugins(economy, storage);
const arrayPlugins = definePlugins([economy, storage]);
const emptyPlugins = definePlugins();

declare module 'seyfert' {
	interface Register {
		plugins: typeof plugins;
	}
}

declare function commandContext(): CommandContext;

expectType<Register>({ plugins });
expectType<SeyfertPlugin<any, any, any>>(economy);
expectType<readonly [typeof economy, typeof storage]>(plugins);
expectType<readonly [typeof economy, typeof storage]>(arrayPlugins);
expectType<readonly []>(emptyPlugins);
expectType<string>(storage.meta.label);
expectType<EconomyApi>({} as PluginExtensionOf<typeof economy>['economy']);
expectType<{ add(amount: number): void }>({} as PluginContextOf<typeof economy>['wallet']);

const client = new Client({ plugins });
client.economy.addCoins('user', 2);

const ctx = commandContext();
ctx.client.economy.addCoins('user', 3);
ctx.wallet.add(3);
