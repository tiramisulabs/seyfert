import {
	ChannelType,
	EmbedColors,
	Formatter,
	HeadingLevel,
	OAuth2Scopes,
	SeyfertError,
	SeyfertErrorMessages,
	TimestampStyle,
	config,
	createValidationMetadata,
	type APIInteractionDataResolvedChannel,
	type BotConfig,
	type ChannelLink,
	type DMChannelStructure,
	type GroupDMChannelStructure,
	type HttpConfig,
	type MessageLink,
	type OAuth2URLOptions,
	type PropWhen,
	type ResolvedChannel,
	type SeyfertErrorCode,
	type ShardData,
	type ShardManagerOptions,
	type StructPropState,
	type StructStates,
	type TextGuildChannelStructure,
	type Timestamp,
	type WorkerData,
	type WorkerInfo,
	type WorkerManagerOptions,
	type WorkerShardInfo,
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
expectType<ShardManagerOptions['intents']>(0);
expectType<WorkerManagerOptions['intents']>(0);
expectType<ShardData>({ resume_seq: null });
expectType<WorkerData['mode']>('threads');
expectType<WorkerInfo>({ shards: [] });
expectType<WorkerShardInfo>({ shardId: 0, workerId: 0, open: false, latency: 0, resumable: false });

declare const resolvedChannel: APIInteractionDataResolvedChannel;
expectType<string | undefined>(resolvedChannel.app_permissions);

expectType<APIInteractionDataResolvedChannel>({
	id: 'dm-channel',
	name: null,
	type: ChannelType.DM,
});
expectType<APIInteractionDataResolvedChannel>({
	id: 'guild-channel',
	name: 'general',
	type: ChannelType.GuildText,
	permissions: '0',
	app_permissions: '0',
});

declare const guildChannelStructure: TextGuildChannelStructure;
// @ts-expect-error Resolved permissions are not present on ordinary guild channel structures.
guildChannelStructure.permissions;
// @ts-expect-error Resolved app permissions are not present on ordinary guild channel structures.
guildChannelStructure.appPermissions;

declare const resolvedChannelStructure: ResolvedChannel<TextGuildChannelStructure>;
expectType<bigint>(resolvedChannelStructure.permissions.bits);
expectType<bigint | undefined>(resolvedChannelStructure.appPermissions?.bits);

declare const dmChannelStructure: DMChannelStructure;
// @ts-expect-error Resolved user permissions are not part of DM channel structures.
dmChannelStructure.permissions;
// @ts-expect-error Resolved app permissions are only provided for channels in guilds where the bot is present.
dmChannelStructure.appPermissions;

declare const resolvedDmChannelStructure: ResolvedChannel<DMChannelStructure>;
// @ts-expect-error Resolving a DM does not add guild permission fields.
resolvedDmChannelStructure.permissions;
// @ts-expect-error Resolving a DM does not add guild app permission fields.
resolvedDmChannelStructure.appPermissions;

declare const resolvedGroupDmChannelStructure: ResolvedChannel<GroupDMChannelStructure>;
expectType<ChannelType.GroupDM>(resolvedGroupDmChannelStructure.type);
expectType<string | null>(resolvedGroupDmChannelStructure.name);
// @ts-expect-error Resolving a group DM does not add guild permission fields.
resolvedGroupDmChannelStructure.permissions;

declare const anyResolvedChannelStructure: ResolvedChannel;
if (anyResolvedChannelStructure.isGuild()) {
	expectType<bigint>(anyResolvedChannelStructure.permissions.bits);
	expectType<bigint | undefined>(anyResolvedChannelStructure.appPermissions?.bits);
}

// @ts-expect-error Resolved permission fields are not provided for DM channels.
expectType<APIInteractionDataResolvedChannel>({
	id: 'invalid-dm-channel',
	name: null,
	type: ChannelType.DM,
	permissions: '0',
});
