import {
	EmbedColors,
	Formatter,
	HeadingLevel,
	OAuth2Scopes,
	PhysicalWorkerPort,
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
	type PhysicalGatewayDispatch,
	type PhysicalHostToWorkerMessage,
	type PhysicalShardTopology,
	type PhysicalWorkerIdentity,
	type PhysicalWorkerReceipt,
	type PropWhen,
	type ResolvedWorkerShardTopology,
	type SeyfertErrorCode,
	type ShardData,
	type ShardManagerOptions,
	type StructPropState,
	type StructStates,
	type Timestamp,
	type WorkerData,
	type WorkerInfo,
	WorkerManager,
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

const physicalIdentity = { slot: 'worker-0', token: 'opaque-token' } satisfies PhysicalWorkerIdentity;
const physicalTopology = {
	shardStart: 0,
	shardEnd: 1,
	totalShards: 1,
} satisfies PhysicalShardTopology;
const physicalPort = new PhysicalWorkerPort<PhysicalGatewayDispatch>({
	adapter: {
		launch: async () => ({ ready: Promise.resolve(), close() {} }),
		dispatch() {},
	},
});
expectType<Promise<PhysicalWorkerReceipt>>(
	physicalPort.control({
		kind: 'launch',
		commandId: 'launch',
		identity: physicalIdentity,
		topology: physicalTopology,
		maxBufferedDispatches: 10,
	}),
);
declare const physicalDispatch: PhysicalGatewayDispatch;
expectType<PhysicalHostToWorkerMessage>({
	type: 'SEYFERT_PHYSICAL_APPLY_DISPATCH',
	...physicalIdentity,
	dispatchId: 'dispatch',
	body: physicalDispatch,
	snapshot: {},
});
declare const rootWorkerManager: WorkerManager;
expectType<Promise<ResolvedWorkerShardTopology>>(rootWorkerManager.resolveShardTopology());
