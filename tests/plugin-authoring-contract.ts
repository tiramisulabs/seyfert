import {
	Client,
	type CommandContext,
	createPlugin,
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

declare module 'seyfert' {
	interface Register {
		plugins: [typeof economy];
	}
}

declare function commandContext(): CommandContext;

expectType<Register>({ plugins: [economy] });
expectType<SeyfertPlugin<any, any, any>>(economy);
expectType<EconomyApi>({} as PluginExtensionOf<typeof economy>['economy']);
expectType<{ add(amount: number): void }>({} as PluginContextOf<typeof economy>['wallet']);

const client = new Client({ plugins: [economy] });
client.economy.addCoins('user', 2);

const ctx = commandContext();
ctx.client.economy.addCoins('user', 3);
ctx.wallet.add(3);
