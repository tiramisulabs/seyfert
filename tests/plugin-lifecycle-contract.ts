import {
	createPlugin,
	type PluginExtensionOf,
	type SeyfertPlugin,
	type SeyfertPluginApi,
	type SeyfertPluginClient,
	type SeyfertPluginTeardownApi,
} from 'seyfert';

declare function expectType<T>(value: T): void;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
	? (<T>() => T extends B ? 1 : 2) extends <T>() => T extends A ? 1 : 2
		? true
		: false
	: false;

interface PublicPluginService {
	get(): string;
}

const pluginService = { get: () => 'ok', inspect: () => 1 };
const setupService = (client: SeyfertPluginClient & { service: PublicPluginService }) => {
	client.service.get();
};

// Explicit callback types may expose a public service interface instead of its implementation.
const setupServicePlugin = createPlugin({
	name: 'public-setup-service',
	client: { service: () => pluginService },
	setup: setupService,
});
expectType<SeyfertPlugin<{ service: PublicPluginService }>>(setupServicePlugin);
expectType<true>(true as Equal<PluginExtensionOf<typeof setupServicePlugin>, { service: PublicPluginService }>);

const teardownServicePlugin = createPlugin({
	name: 'public-teardown-service',
	meta: { kind: 'service' },
	client: { service: () => pluginService },
	teardown: setupService,
});
expectType<SeyfertPlugin<{ service: PublicPluginService }>>(teardownServicePlugin);

const registerServicePlugin = createPlugin({
	name: 'public-register-service',
	meta: { kind: 'service' },
	client: { service: () => pluginService },
	register(api: SeyfertPluginApi<{}, { service: PublicPluginService }>) {
		api.hooks.on('plugins:ready', client => {
			client.service.get();
		});
	},
});
expectType<SeyfertPlugin<{ service: PublicPluginService }>>(registerServicePlugin);

createPlugin({
	name: 'required-setup-api',
	setup(_client, api: SeyfertPluginApi<{}>) {
		api.gateway.addIntents('Guilds');
	},
} satisfies SeyfertPlugin);

createPlugin({
	name: 'required-teardown-api',
	teardown(_client, api: SeyfertPluginTeardownApi) {
		api.shared.has('ledger');
	},
});

createPlugin({
	name: 'incomplete-register-service',
	client: { service: () => ({ get: () => 'ok' }) },
	// @ts-expect-error register cannot require methods absent from the client factory
	register(api: SeyfertPluginApi<{}, { service: typeof pluginService }>) {
		api.hooks.on('plugins:ready', client => {
			client.service.inspect();
		});
	},
});

createPlugin({
	name: 'incomplete-setup-api-service',
	client: { service: () => ({ get: () => 'ok' }) },
	// @ts-expect-error a required setup API cannot promise methods absent from the client factory
	setup(_client, api: SeyfertPluginApi<{}, { service: typeof pluginService }>) {
		api.hooks.on('plugins:ready', client => {
			client.service.inspect();
		});
	},
});

createPlugin({
	name: 'unvalidated-setup-service',
	client: { service: (): unknown => pluginService },
	// @ts-expect-error unknown factory results cannot satisfy a typed setup client
	setup: setupService,
});

createPlugin({
	name: 'incomplete-teardown-service',
	client: { service: () => ({ get: () => 'ok' }) },
	// @ts-expect-error teardown cannot require methods absent from the client factory
	teardown(client: SeyfertPluginClient & { service: typeof pluginService }) {
		client.service.inspect();
	},
});
