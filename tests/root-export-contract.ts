import {
	EmbedColors,
	Formatter,
	HeadingLevel,
	OAuth2Scopes,
	SeyfertError,
	SeyfertErrorMessages,
	TimestampStyle,
	config,
	createValidationMetadata,
	type BotConfig,
	type ChannelLink,
	type HttpConfig,
	type MessageLink,
	type OAuth2URLOptions,
	type PropWhen,
	type SeyfertErrorCode,
	type StructPropState,
	type StructStates,
	type Timestamp,
} from 'seyfert';

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
expectType<SeyfertErrorCode>(new SeyfertError('INVALID_TOKEN').code);
expectType<string>(SeyfertErrorMessages.INVALID_TOKEN);
expectType<{
	expected: unknown;
	received: unknown;
	receivedType: string;
}>(createValidationMetadata('token', 'bad'));
expectType<number>(EmbedColors.Default);
expectType<TimestampStyle>(TimestampStyle.RelativeTime);
expectType<HeadingLevel>(HeadingLevel.H1);
expectType<OAuth2URLOptions>({ scopes: [OAuth2Scopes.Bot] });
declare const structState: StructStates;
declare const cachedStructProp: StructPropState<number, 'cached', 'cached'>;
declare const createdProp: PropWhen<'create', number, 'create'>;
declare const missingCreatedProp: PropWhen<'create', number, 'api'>;
expectType<'cached' | 'api' | 'create'>(structState);
expectType<number | undefined>(cachedStructProp);
expectType<number>(createdProp);
expectType<undefined>(missingCreatedProp);
