import { config, type BotConfig, type HttpConfig } from 'seyfert';

declare function expectType<T>(value: T): void;

const rootBotConfig = config.bot({
	token: 'token',
	locations: { base: 'src' },
	intents: ['Guilds'],
});
expectType<BotConfig>(rootBotConfig);
expectType<number>(rootBotConfig.intents);

const rootHttpConfig = config.http({
	token: 'token',
	applicationId: 'application-id',
	publicKey: 'public-key',
	locations: { base: 'src' },
});
expectType<HttpConfig>(rootHttpConfig);
expectType<number>(rootHttpConfig.port);
