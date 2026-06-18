import { Formatter, config, type BotConfig, type ChannelLink, type HttpConfig, type MessageLink, type Timestamp } from 'seyfert';

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

expectType<MessageLink>(Formatter.messageLink('guild-id', 'channel-id', 'message-id'));
expectType<ChannelLink>(Formatter.channelLink('channel-id'));
expectType<Timestamp>(Formatter.timestamp(Date.now()));
