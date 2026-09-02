import {
	ApplicationIntegrationType,
	AuditLogEvent,
	ChannelType,
	EmbedColors,
	Formatter,
	HeadingLevel,
	MessageActivityType,
	OAuth2Scopes,
	PresenceUpdateReceiveStatus,
	SeyfertError,
	SeyfertErrorMessages,
	SubscriptionStatus,
	TimestampStyle,
	config,
	createValidationMetadata,
	type APIApplication,
	type APIChannelBase,
	type APIGroupDMChannel,
	type APIInteractionDataResolvedChannel,
	type APIRoutes,
	type ApplicationStructure,
	type BotConfig,
	type ChannelLink,
	type CommandOptionChannel,
	type DMChannelStructure,
	type GatewayMessageCreateDispatchData,
	type GatewayPresenceClientStatus,
	type GroupDMChannelStructure,
	type HttpConfig,
	LabelComponent,
	type MaybeResolvedChannel,
	type ManagerMessages,
	type ManagerSendCacheResult,
	type MessageLink,
	type MessageStructure,
	type OAuth2URLOptions,
	type PropWhen,
	type RESTDeleteAPICurrentUserApplicationRoleConnectionResult,
	type RESTOAuth2BotAuthorizationQuery,
	type RESTPatchCurrentApplicationJSONBody,
	type ResolvedChannel,
	type SeyfertErrorCode,
	type SerializedWorkerError,
	type SerializedWorkerValue,
	type ShardData,
	type ShardManagerOptions,
	type StructPropState,
	type StructStates,
	type TextChannelType,
	type TextGuildChannelStructure,
	type Timestamp,
	type TopLevelComponents,
	type WorkerData,
	type WorkerInfo,
	type WorkerManagerOptions,
	type WorkerShardInfo,
} from 'seyfert';

declare function expectType<T>(value: T): void;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
	? (<T>() => T extends B ? 1 : 2) extends <T>() => T extends A ? 1 : 2
		? true
		: false
	: false;

expectType<true>(true as Equal<Extract<TopLevelComponents, LabelComponent>, LabelComponent>);
expectType<typeof LabelComponent>(LabelComponent);

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
declare const dynamicSeyfertErrorCode: string;
expectType<SeyfertErrorCode>(new SeyfertError(dynamicSeyfertErrorCode).code);
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
declare const managerMessage: ManagerMessages;
expectType<string>(managerMessage.type);
expectType<SerializedWorkerValue>({ type: 'record', value: { cause: ['nested', 1, null] } });
expectType<SerializedWorkerError>({
	type: 'error',
	name: 'Error',
	message: 'failed',
	cause: { type: 'record', value: { code: 'nested' } },
});
expectType<ManagerSendCacheResult>({
	type: 'CACHE_RESULT',
	nonce: 'cache-request',
	error: { type: 'error', name: 'Error', message: 'failed' },
});

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

declare const maybeResolvedChannelStructure: MaybeResolvedChannel<TextGuildChannelStructure>;
expectType<bigint | undefined>(maybeResolvedChannelStructure.permissions?.bits);
expectType<bigint | undefined>(maybeResolvedChannelStructure.appPermissions?.bits);

declare const commandOptionChannelStructure: CommandOptionChannel<ChannelType.GuildText>;
expectType<bigint>(commandOptionChannelStructure.permissions.bits);
expectType<bigint | undefined>(commandOptionChannelStructure.appPermissions?.bits);

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

declare const maybeResolvedDmChannelStructure: MaybeResolvedChannel<DMChannelStructure>;
// @ts-expect-error Prefix support does not add guild permission fields to DMs.
maybeResolvedDmChannelStructure.permissions;
// @ts-expect-error Prefix support does not add guild app permission fields to DMs.
maybeResolvedDmChannelStructure.appPermissions;

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

expectType<0>(SubscriptionStatus.Active);
expectType<1>(SubscriptionStatus.Inactive);
expectType<2>(SubscriptionStatus.Ending);
expectType<192>(AuditLogEvent.VoiceChannelStatusCreate);
expectType<192>(AuditLogEvent.VoiceChannelStatusUpdate);
expectType<6>(MessageActivityType.StreamRequest);
expectType<'identify.premium'>(OAuth2Scopes.IdentifyPremium);

expectType<RESTOAuth2BotAuthorizationQuery>({ client_id: 'application-id' });
expectType<RESTOAuth2BotAuthorizationQuery>({
	client_id: 'application-id',
	integration_type: ApplicationIntegrationType.GuildInstall,
});

declare const application: APIApplication;
expectType<string | undefined>(application.flags_new);

declare const applicationStructure: ApplicationStructure;
expectType<string | undefined>(applicationStructure.flagsNew);

// @ts-expect-error flags_new is response-only; application writes continue to use flags.
expectType<RESTPatchCurrentApplicationJSONBody>({ flags_new: '8192' });

declare const gatewayMessage: GatewayMessageCreateDispatchData;
expectType<TextChannelType | undefined>(gatewayMessage.channel_type);

declare const messageStructure: MessageStructure;
expectType<TextChannelType | undefined>(messageStructure.channelType);

declare const clientStatus: GatewayPresenceClientStatus;
expectType<PresenceUpdateReceiveStatus | undefined>(clientStatus.vr);

declare const guildChannel: APIChannelBase<ChannelType.GuildText>;
expectType<string | null | undefined>(guildChannel.application_id);
expectType<string | null | undefined>(guildChannelStructure.applicationId);

declare const groupDM: APIGroupDMChannel;
expectType<string | undefined>(groupDM.application_id);

declare const routes: APIRoutes;
expectType<Promise<RESTDeleteAPICurrentUserApplicationRoleConnectionResult>>(
	routes.users('@me').applications('application-id')['role-connection'].delete(),
);
