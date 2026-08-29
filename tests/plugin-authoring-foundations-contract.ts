import {
	ApplicationCommandOptionType,
	type BulkGetKey,
	type Cache,
	type CallbackEventHandler,
	type Client,
	type ClientEvent,
	type Collection,
	type Command,
	type ComponentCollectorStopReason,
	type ContextMenuCommand,
	calculateUserDefaultAvatarIndex,
	createEvent,
	defineGroups,
	type EntryPointCommand,
	Formatter,
	type GatewaySendPayload,
	Group,
	Groups,
	GroupsT,
	type GuildBasedResource,
	type GuildRelatedResource,
	LimitedCollection,
	type LimitedCollectionData,
	type MessageStructure,
	OAuth2Scopes,
	type OptionResolvedWithValue,
	type PermissionFlagsBits,
	type PluginLoadedMetadata,
	type ReturnOptionsTypes,
	SeyfertError,
	type SeyfertErrorCode,
	type TextGuildChannelStructure,
	type UserAvatarDefault,
	type UserStructure,
	type UsingClient,
	type VoiceStateStructure,
	type Webhook,
	type WebhookMessage,
	type WebhookMessageStructure,
	type WorkerClient,
} from 'seyfert';
import type { Awaitable, MakePresent, MakeRequired, PickPresent, PickRequired } from '../lib/common';
import { snowflakeToTimestamp } from '../lib/common/it/utils';
import type { BitField } from '../lib/structures/extra/BitField';
import { PermissionsBitField } from '../lib/structures/extra/Permissions';

declare function expectType<T>(value: T): void;
declare const publicWorkerClient: WorkerClient;
declare const publicGatewayPayload: GatewaySendPayload;
expectType<Promise<boolean>>(publicWorkerClient.sendGatewayPayload(0, publicGatewayPayload));

type IsAny<T> = 0 extends 1 & T ? true : false;
type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? (<T>() => T extends B ? 1 : 2) extends <T>() => T extends A ? 1 : 2
			? true
			: false
		: false;

type PresentFixture = {
	flag?: boolean;
	count?: 0 | 1;
	text?: '' | 'x';
	big?: 0n | 1n;
	nil?: null | 'ok';
};

type PresentFixtureAll = MakePresent<PresentFixture, 'flag' | 'count' | 'text' | 'big' | 'nil'>;
expectType<true>(true as Equal<PresentFixtureAll['flag'], boolean>);
expectType<true>(true as Equal<PresentFixtureAll['count'], 0 | 1>);
expectType<true>(true as Equal<PresentFixtureAll['text'], '' | 'x'>);
expectType<true>(true as Equal<PresentFixtureAll['big'], 0n | 1n>);
expectType<true>(true as Equal<PresentFixtureAll['nil'], 'ok'>);

type PickPresentFixture = PickPresent<PresentFixture, 'flag' | 'count' | 'text' | 'big' | 'nil'>;
expectType<true>(true as Equal<PickPresentFixture['flag'], boolean>);
expectType<true>(true as Equal<PickPresentFixture['count'], 0 | 1>);
expectType<true>(true as Equal<PickPresentFixture['text'], '' | 'x'>);
expectType<true>(true as Equal<PickPresentFixture['big'], 0n | 1n>);
expectType<true>(true as Equal<PickPresentFixture['nil'], 'ok'>);
expectType<true>(true as Equal<MakeRequired<{ flag?: boolean }, 'flag'>['flag'], true>);
expectType<true>(true as Equal<PickRequired<{ flag?: boolean }, 'flag'>['flag'], true | undefined>);
expectType<true>(true as Equal<OptionResolvedWithValue['value'], string | number | boolean>);
expectType<number>(snowflakeToTimestamp('123456789012345678'));
declare const unknownContractError: unknown;
if (SeyfertError.is(unknownContractError)) {
	expectType<SeyfertError>(unknownContractError);
	expectType<SeyfertErrorCode>(unknownContractError.code);
}
if (SeyfertError.is(unknownContractError, 'INVALID_TOKEN')) {
	expectType<SeyfertError & { code: 'INVALID_TOKEN' }>(unknownContractError);
	expectType<'INVALID_TOKEN'>(unknownContractError.code);
}
type ExpectedReturnOptionsTypeKeys =
	| ApplicationCommandOptionType.Subcommand
	| ApplicationCommandOptionType.SubcommandGroup
	| ApplicationCommandOptionType.String
	| ApplicationCommandOptionType.Integer
	| ApplicationCommandOptionType.Boolean
	| ApplicationCommandOptionType.User
	| ApplicationCommandOptionType.Channel
	| ApplicationCommandOptionType.Role
	| ApplicationCommandOptionType.Mentionable
	| ApplicationCommandOptionType.Number
	| ApplicationCommandOptionType.Attachment;
expectType<true>(true as Equal<keyof ReturnOptionsTypes, ExpectedReturnOptionsTypeKeys>);
expectType<string>(Formatter.timestamp(Date.now()));
expectType<`> ${string}`>(Formatter.quote('hello'));
expectType<`>>> ${string}`>(Formatter.blockQuote('hello'));
expectType<`<${'a' | ''}:${string}:${string}>`>(Formatter.emojiMention('123', 'wave'));
expectType<`<${'a' | ''}:${string}:${string}>`>(Formatter.emojiMention('123', null, true));
expectType<string>(
	Formatter.generateOAuth2URL('123', {
		scopes: [OAuth2Scopes.Bot],
	}),
);

const permissionsContract = new PermissionsBitField(['SendMessages']);
type PermissionFlagKey = keyof typeof PermissionFlagsBits;
expectType<boolean>(permissionsContract.has('SendMessages'));
expectType<boolean>(permissionsContract.strictHas('SendMessages'));
expectType<boolean>(permissionsContract.has(['SendMessages']));
expectType<boolean>(permissionsContract.strictHas(['SendMessages']));
declare const bitfieldContract: BitField<typeof PermissionFlagsBits>;
expectType<PermissionFlagKey[]>(bitfieldContract.keys());
expectType<PermissionFlagKey[]>(permissionsContract.keys());

type HumanMember = { type: 'human'; username: string };
type BotMember = { type: 'bot'; applicationId: string };
type MemberUnion = HumanMember | BotMember;

declare const collectionMembers: Collection<string, MemberUnion>;
declare function isHuman(member: MemberUnion): member is HumanMember;
expectType<HumanMember[]>(collectionMembers.filter(isHuman));
expectType<HumanMember | undefined>(collectionMembers.find(isHuman));
expectType<Collection<string, HumanMember>>(collectionMembers.filterCollection(isHuman));
expectType<MemberUnion[]>(collectionMembers.filter(member => member.type === 'human'));
expectType<MemberUnion | undefined>(collectionMembers.find(member => member.type === 'human'));
expectType<Collection<string, MemberUnion>>(collectionMembers.filterCollection(member => member.type === 'human'));

const limitedCollectionContract = new LimitedCollection<string, number>();
expectType<IterableIterator<number>>(limitedCollectionContract.values());
expectType<IterableIterator<[string, number]>>(limitedCollectionContract.entries());
expectType<IterableIterator<LimitedCollectionData<number>>>(limitedCollectionContract.rawValues());
expectType<IterableIterator<[string, LimitedCollectionData<number>]>>(limitedCollectionContract.rawEntries());
expectType<IterableIterator<[string, number]>>(limitedCollectionContract[Symbol.iterator]());

declare const cacheContract: Cache;
const cacheBulkGetKeys = [
	['users', 'user-id'],
	['roles', 'role-id'],
	['members', 'member-id', 'guild-id'],
] as const satisfies readonly BulkGetKey[];
const cacheBulkGetResult = cacheContract.bulkGet(cacheBulkGetKeys);
type CacheBulkGetResult = Awaited<typeof cacheBulkGetResult>;
expectType<true>(true as Equal<keyof CacheBulkGetResult, 'users' | 'roles' | 'members'>);
// @ts-expect-error tuple-aware bulkGet results only include requested resource keys.
expectType<CacheBulkGetResult['channels']>([]);
declare const dynamicBulkGetKeys: BulkGetKey[];
const dynamicBulkGetResult = cacheContract.bulkGet(dynamicBulkGetKeys);
type DynamicBulkGetResult = Awaited<typeof dynamicBulkGetResult>;
expectType<true>(true as 'channels' extends keyof DynamicBulkGetResult ? true : false);

declare const guildRelatedResourceContract: GuildRelatedResource;
guildRelatedResourceContract.flush();
declare const guildBasedResourceContract: GuildBasedResource;
// @ts-expect-error GuildBasedResource.flush requires an explicit guild selector.
guildBasedResourceContract.flush();
const wildcardCacheSelector = '*' as const;
declare const cacheResourceSelector: string & {};
cacheContract.roles?.values(wildcardCacheSelector);
cacheContract.channels?.values(wildcardCacheSelector);
cacheContract.messages?.values(wildcardCacheSelector);
cacheContract.messages?.keys(wildcardCacheSelector);
cacheContract.emojis?.values(wildcardCacheSelector);
cacheContract.stickers?.values(wildcardCacheSelector);
cacheContract.overwrites?.values(wildcardCacheSelector);
cacheContract.members?.values(cacheResourceSelector);
cacheContract.bans?.values(cacheResourceSelector);
cacheContract.voiceStates?.values(wildcardCacheSelector);

type ChannelPinResult = Awaited<ReturnType<Client['channels']['pins']>>;
expectType<true>(true as Equal<ChannelPinResult['items'][number]['pinnedAt'], number>);
expectType<true>(true as Equal<UserAvatarDefault, 0 | 1 | 2 | 3 | 4 | 5>);
expectType<UserAvatarDefault>(calculateUserDefaultAvatarIndex('123456789012345678', '0'));
expectType<true>(true as Equal<ReturnType<typeof calculateUserDefaultAvatarIndex>, UserAvatarDefault>);

declare const webhookWriteClient: Client;
declare const webhookWrite: Webhook;
declare const webhookBackedMessage: WebhookMessage;
declare const dynamicWebhookWait: boolean;
expectType<Promise<WebhookMessageStructure>>(
	webhookWriteClient.webhooks.writeMessage('123', 'token', { body: { content: 'wait' }, query: { wait: true } }),
);
expectType<Promise<WebhookMessageStructure | null>>(
	webhookWriteClient.webhooks.writeMessage('123', 'token', { body: { content: 'default' } }),
);
expectType<Promise<WebhookMessageStructure | null>>(
	webhookWriteClient.webhooks.writeMessage('123', 'token', { body: { content: 'no wait' }, query: { wait: false } }),
);
expectType<Promise<WebhookMessageStructure | null>>(
	webhookWriteClient.webhooks.writeMessage('123', 'token', {
		body: { content: 'dynamic wait' },
		query: { wait: dynamicWebhookWait },
	}),
);
expectType<Promise<WebhookMessageStructure>>(
	webhookWrite.messages.write({ body: { content: 'wait' }, query: { wait: true } }),
);
expectType<Promise<WebhookMessageStructure | null>>(webhookWrite.messages.write({ body: { content: 'default' } }));
expectType<Promise<WebhookMessageStructure | null>>(
	webhookWrite.messages.write({ body: { content: 'no wait' }, query: { wait: false } }),
);
expectType<Promise<WebhookMessageStructure>>(webhookBackedMessage.write({ content: 'wait', query: { wait: true } }));
expectType<Promise<WebhookMessageStructure | null>>(webhookBackedMessage.write({ content: 'default' }));
expectType<Promise<WebhookMessageStructure | null>>(
	webhookBackedMessage.write({ content: 'no wait', query: { wait: false } }),
);

const falseBooleanOption = {
	name: 'hidden',
	type: ApplicationCommandOptionType.Boolean,
	value: false,
	focused: false,
} satisfies OptionResolvedWithValue;
expectType<false>(falseBooleanOption.value);
expectType<false>(falseBooleanOption.focused);

type CommandsLoadedCallbackParams = Parameters<CallbackEventHandler['commandsLoaded']>;
expectType<true>(
	true as Equal<
		CommandsLoadedCallbackParams,
		[PluginLoadedMetadata<'commands', Command | ContextMenuCommand | EntryPointCommand>, UsingClient]
	>,
);
expectType<true>(true as Equal<CommandsLoadedCallbackParams['length'], 2>);

type BotReadyCallbackParams = Parameters<CallbackEventHandler['botReady']>;
expectType<true>(true as Equal<BotReadyCallbackParams['length'], 3>);
expectType<true>(true as Equal<BotReadyCallbackParams[2], number>);
expectType<false>(false as IsAny<ReturnType<ClientEvent['run']>>);
expectType<true>(true as Equal<ReturnType<ClientEvent['run']>, Awaitable<unknown>>);

const asyncCreateEventContract = createEvent({
	data: { name: 'botReady' },
	async run() {},
});
expectType<true>(true as Equal<ReturnType<typeof asyncCreateEventContract.run>, Awaitable<unknown>>);

expectType<ComponentCollectorStopReason>('messageDelete');
expectType<ComponentCollectorStopReason>('channelDelete');
expectType<ComponentCollectorStopReason>('guildDelete');
expectType<ComponentCollectorStopReason>('idle');
expectType<ComponentCollectorStopReason>('timeout');
expectType<ComponentCollectorStopReason>('custom-reason');
expectType<ComponentCollectorStopReason>(undefined);

declare const messageListClient: Client;
declare const messageListChannel: TextGuildChannelStructure;
expectType<Promise<MessageStructure[]>>(messageListClient.messages.list('123'));
expectType<Promise<MessageStructure[]>>(messageListChannel.messages.list());

declare const pollMessageContract: MessageStructure;
expectType<Promise<MessageStructure>>(pollMessageContract.endPoll());
expectType<Promise<UserStructure[]>>(pollMessageContract.getAnswerVoters(1));
expectType<Promise<UserStructure[]>>(pollMessageContract.getAnswerVoters(1, true));
// @ts-expect-error poll answer ids are limited to Discord's valid answer id range
pollMessageContract.getAnswerVoters(11);

declare const voiceStateContract: VoiceStateStructure;
expectType<boolean>(voiceStateContract.isDeafened);
expectType<boolean>(voiceStateContract.isCameraOn);
expectType<boolean>(voiceStateContract.isStreaming);
expectType<boolean>(voiceStateContract.isSuppressed);

const localizedGroups = defineGroups({
	moderation: {
		name: [['en-US', 'Moderation']],
		description: [['en-US', 'Moderation tools']],
		defaultDescription: 'Moderation tools',
		aliases: ['mod'],
	},
	economy: {
		defaultDescription: 'Economy tools',
	},
});
expectType<true>(true as Equal<keyof typeof localizedGroups & string, 'moderation' | 'economy'>);

const translatedGroups = defineGroups({
	admin: {
		name: 'commands.groups.admin.name',
		description: 'commands.groups.admin.description',
		defaultDescription: 'Admin tools',
		aliases: ['adm'],
	},
	reports: {
		defaultDescription: 'Report tools',
	},
});
expectType<true>(true as Equal<keyof typeof translatedGroups & string, 'admin' | 'reports'>);

// @ts-expect-error group definitions must be either all localized or all translated
defineGroups({
	localized: {
		name: [['en-US', 'Localized']],
		defaultDescription: 'Localized group',
	},
	translated: {
		name: 'commands.groups.admin.name',
		defaultDescription: 'Translated group',
	},
});

class GroupContractParent {}
class GroupContractSubcommand {}

Groups(localizedGroups)(GroupContractParent);
GroupsT(translatedGroups)(GroupContractParent);
Group(localizedGroups, 'moderation')(GroupContractSubcommand);
Group(translatedGroups, 'admin')(GroupContractSubcommand);
Group('legacyString')(GroupContractSubcommand);
// @ts-expect-error group names passed with a group definition must match declared keys
Group(localizedGroups, 'moderaton')(GroupContractSubcommand);
