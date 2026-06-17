import {
	ApplicationCommandType,
	ApplicationCommandOptionType,
	type AllGuildChannels,
	type AutocompleteCallback,
	type AutocompleteInteraction,
	type BanOptions,
	type BaseChannelStructure,
	type BaseGuildChannelStructure,
	type BaseInteraction,
	BaseResource,
	type Cache,
	Client,
	Command,
	ComponentCommand,
	type CommandMetadata,
	type CommandContext,
	ContextMenuCommand,
	createIntegerOption,
	createMiddleware,
	createNumberOption,
	defineGroups,
	definePlugin,
	createPlugin,
	createStringOption,
	createSharedKey,
	definePlugins,
	type DMChannelStructure,
	GatewayIntentBits,
	GatewayOpcodes,
	type GatewayDispatchPayload,
	type InferMiddlewares,
	Middlewares,
	middlewares,
	type GatewaySendPayload,
	GuildBan,
	GuildMember,
	type GuildMemberStructure,
	type GuildRoleStructure,
	type ComponentContext,
	type EntryPointContext,
	EntryPointCommand,
	Embed,
	Formatter,
	Group,
	Groups,
	GroupsT,
	type MenuCommandContext,
	type MessageStructure,
	type MetadataMiddleware,
	type ModalContext,
	type MiddlewareContext,
	type OnAutocompleteErrorCallback,
	Options,
	type PluginContextOf,
	type PluginContextInteraction,
	type PluginContextMapOf,
	type PluginDiagnosticCode,
	type PluginExtensionOf,
	type PluginHandlerKind,
	type PluginLoadedMetadata,
	type PluginMiddlewaresMapOf,
	type PluginCommandObserver,
	type PluginCommandObserverContext,
	PluginOrder,
	type PluginOrderOpt,
	type SeyfertPluginHooks,
	type PluginUsingClient,
	PermissionFlagsBits,
	type ReturnCache,
	type RegisteredPluginMiddlewares,
	type RegisteredPluginShared,
	type ResolvedRegisteredMiddlewares,
	RadioGroupOption,
	StringSelectMenu,
	StringSelectOption,
	SubCommand,
	type Webhook,
	type ClientMiddlewares,
	type OptionResolvedWithValue,
	type SharedKey,
	type SeyfertPlugin,
	type SeyfertPluginApi,
	type SeyfertPluginOptions,
	type SemverRange,
	type ShardManager,
	WorkerManager,
	type config,
	ModalCommand,
	type WebhookMessage,
	type WebhookMessageStructure,
	type APISelectMenuOption,
	type APIEmbed,
	type CallbackEventHandler,
	type ClientOptions,
	EntryPointCommandHandlerType,
	type Collection,
	type UsingClient,
	PresenceUpdateStatus,
} from 'seyfert';
import type { MakePresent, MakeRequired, PickPresent, PickRequired } from '../lib/common';
import type { BanShorter } from '../lib/common/shorters/bans';
import type { MemberShorter } from '../lib/common/shorters/members';
import type { BitField } from '../lib/structures/extra/BitField';
import { PermissionsBitField } from '../lib/structures/extra/Permissions';
import type { ShardManagerOptions, WorkerManagerOptions } from '../lib/websocket/discord/shared';
import type { ManagerAllowConnect, ManagerAllowConnectResharding } from '../lib/websocket/discord/workermanager';

declare function expectType<T>(value: T): void;
type IsAny<T> = 0 extends 1 & T ? true : false;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
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
expectType<string>(Formatter.timestamp(Date.now()));

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
expectType<MemberUnion[]>(collectionMembers.filter(member => member.type === 'human'));
expectType<MemberUnion | undefined>(collectionMembers.find(member => member.type === 'human'));

type ChannelPinResult = Awaited<ReturnType<Client['channels']['pins']>>;
expectType<true>(true as Equal<ChannelPinResult['items'][number]['pinnedAt'], number>);

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
		[
			PluginLoadedMetadata<'commands', Command | ContextMenuCommand>,
			UsingClient,
		]
	>,
);
expectType<true>(true as Equal<CommandsLoadedCallbackParams['length'], 2>);

type BotReadyCallbackParams = Parameters<CallbackEventHandler['botReady']>;
expectType<true>(true as Equal<BotReadyCallbackParams['length'], 3>);
expectType<true>(true as Equal<BotReadyCallbackParams[2], number>);

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

expectType<true>(true as Equal<ShardManager['options']['debug'], boolean>);
expectType<true>(true as Equal<ShardManager['options']['intents'], number>);
expectType<true>(true as Equal<ReturnType<typeof config.bot>['intents'], number>);
expectType<true>(true as Equal<ReturnType<typeof config.http>['port'], number>);
expectType<true>(
	true as Equal<Awaited<ReturnType<GuildMemberStructure['roles']['highest']>>, GuildRoleStructure | undefined>,
);
expectType<Promise<GuildRoleStructure>>(
	({} as GuildRoleStructure).edit({ name: 'moderators' }, 'sync role name'),
);
expectType<true>(true as Equal<BanOptions, { deleteMessageSeconds?: number; reason?: string }>);
declare const guildMember: GuildMember;
expectType<Promise<GuildMemberStructure>>(guildMember.timeout(1_000, 'one second'));
expectType<Promise<GuildMemberStructure>>(guildMember.timeout(null, 'clear timeout'));
expectType<false | number>(guildMember.hasTimeout);
expectType<Promise<void>>(guildMember.ban({ deleteMessageSeconds: 60, reason: 'cleanup' }));
// @ts-expect-error GuildMember.timeout accepts milliseconds as a number, not duration objects.
guildMember.timeout({ seconds: 1 });
// @ts-expect-error GuildMember.ban uses the public deleteMessageSeconds option.
guildMember.ban({ delete_message_seconds: 60 });
// @ts-expect-error GuildMember.ban no longer accepts positional body and reason arguments.
guildMember.ban({ delete_message_seconds: 60 }, 'cleanup');

const guildMemberMethods = GuildMember.methods({ client: {} as any, guildId: '123' });
expectType<Promise<void>>(guildMemberMethods.ban('123', { deleteMessageSeconds: 60, reason: 'cleanup' }));
// @ts-expect-error BaseGuildMember.methods().ban no longer accepts positional body and reason arguments.
guildMemberMethods.ban('123', { delete_message_seconds: 60 }, 'cleanup');

declare const guildBan: GuildBan;
expectType<Promise<void>>(guildBan.create({ deleteMessageSeconds: 60, reason: 'cleanup' }));
// @ts-expect-error GuildBan.create uses the public deleteMessageSeconds option.
guildBan.create({ delete_message_seconds: 60 });

const guildBanMethods = GuildBan.methods({ client: {} as any, guildId: '123' });
expectType<Promise<void>>(guildBanMethods.create('456', { deleteMessageSeconds: 60, reason: 'cleanup' }));
// @ts-expect-error GuildBan.methods().create no longer accepts positional body and reason arguments.
guildBanMethods.create('456', { delete_message_seconds: 60 }, 'cleanup');

declare const memberShorter: MemberShorter;
expectType<Promise<void>>(memberShorter.ban('123', '456', { deleteMessageSeconds: 60, reason: 'cleanup' }));
// @ts-expect-error MemberShorter.ban no longer accepts positional body and reason arguments.
memberShorter.ban('123', '456', { delete_message_seconds: 60 }, 'cleanup');

declare const banShorter: BanShorter;
expectType<Promise<void>>(banShorter.create('123', '456', { deleteMessageSeconds: 60, reason: 'cleanup' }));
// @ts-expect-error BanShorter.create no longer accepts positional body and reason arguments.
banShorter.create('123', '456', { delete_message_seconds: 60 }, 'cleanup');
expectType<true>(true as Equal<BaseInteraction['replied'], boolean | undefined>);
// @ts-expect-error BaseInteraction.replied is public reply state, not the pending reply operation.
expectType<BaseInteraction['replied']>(Promise.resolve(true));

createIntegerOption({
	description: 'Integer autocomplete',
	autocomplete(interaction) {
		interaction.respond([{ name: 'D6', value: 6 }]);
		// @ts-expect-error integer autocomplete rejects string choices
		interaction.respond([{ name: 'D4', value: 'four' }]);
	},
	onAutocompleteError(interaction) {
		interaction.respond([{ name: 'D8', value: 8 }]);
		// @ts-expect-error integer autocomplete errors reject string choices
		interaction.respond([{ name: 'D10', value: 'ten' }]);
	},
});

createNumberOption({
	description: 'Number autocomplete',
	autocomplete(interaction) {
		interaction.respond([{ name: 'Half', value: 0.5 }]);
		// @ts-expect-error number autocomplete rejects string choices
		interaction.respond([{ name: 'Whole', value: 'one' }]);
	},
});

createStringOption({
	description: 'String autocomplete',
	autocomplete(interaction) {
		interaction.respond([{ name: 'Four', value: 'four' }]);
		// @ts-expect-error string autocomplete rejects numeric choices
		interaction.respond([{ name: 'D4', value: 4 }]);
	},
	onAutocompleteError(interaction) {
		interaction.respond([{ name: 'Six', value: 'six' }]);
		// @ts-expect-error string autocomplete errors reject numeric choices
		interaction.respond([{ name: 'D6', value: 6 }]);
	},
});

const bareAutocompleteCallback: AutocompleteCallback = interaction => {
	interaction.respond([{ name: 'D6', value: 6 }]);
	interaction.respond([{ name: 'Four', value: 'four' }]);
};
expectType<AutocompleteCallback>(bareAutocompleteCallback);

const numberAutocompleteCallback: AutocompleteCallback<number> = interaction => {
	interaction.respond([{ name: 'D6', value: 6 }]);
	// @ts-expect-error explicit numeric autocomplete rejects string choices
	interaction.respond([{ name: 'D4', value: 'four' }]);
};
expectType<AutocompleteCallback<number>>(numberAutocompleteCallback);

const bareOnAutocompleteErrorCallback: OnAutocompleteErrorCallback = interaction => {
	interaction.respond([{ name: 'D8', value: 8 }]);
	interaction.respond([{ name: 'Eight', value: 'eight' }]);
};
expectType<OnAutocompleteErrorCallback>(bareOnAutocompleteErrorCallback);

declare const bareAutocompleteInteraction: AutocompleteInteraction;
bareAutocompleteInteraction.respond([{ name: 'D6', value: 6 }]);
bareAutocompleteInteraction.respond([{ name: 'Four', value: 'four' }]);

declare const stringAutocompleteInteraction: AutocompleteInteraction<boolean, string>;
stringAutocompleteInteraction.respond([{ name: 'Four', value: 'four' }]);
// @ts-expect-error explicit string autocomplete interaction rejects numeric choices
stringAutocompleteInteraction.respond([{ name: 'D4', value: 4 }]);

class EconomyApi {
	addCoins(_userId: string, _amount: number) {}
}

class LedgerService {
	readBalance(_userId: string) {
		return 100;
	}
}

class QueuesRegistry {
	readonly kind = 'queues' as const;
}

class CooldownManager {
	readonly kind = 'cooldown' as const;
}

class ContractCommand extends Command {
	name = 'contract';
	description = 'Contract';
	filter(context: CommandContext): boolean | Promise<boolean> {
		expectType<CommandContext>(context);
		return true;
	}
	run() {}
}

class ContractSubCommand extends SubCommand {
	name = 'contract-sub';
	description = 'Contract subcommand';
	filter(context: CommandContext): boolean | Promise<boolean> {
		expectType<CommandContext>(context);
		return Promise.resolve(true);
	}
	run() {}
}

class ContractContextMenuCommand extends ContextMenuCommand {
	name = 'contract-menu';
	type = ApplicationCommandType.Message as const;
	filter(context: MenuCommandContext<any>): boolean | Promise<boolean> {
		expectType<MenuCommandContext<any>>(context);
		return true;
	}
	run() {}
}

class ContractEntryPointCommand extends EntryPointCommand {
	name = 'contract-entry';
	description = 'Contract entry';
	handler = EntryPointCommandHandlerType.AppHandler;
	filter(context: EntryPointContext): boolean | Promise<boolean> {
		expectType<EntryPointContext>(context);
		return Promise.resolve(true);
	}
	run() {}
}

declare const commandFilterContract: Command;
expectType<((context: CommandContext) => boolean | Promise<boolean>) | undefined>(commandFilterContract.filter);
declare const subCommandFilterContract: SubCommand;
expectType<((context: CommandContext) => boolean | Promise<boolean>) | undefined>(subCommandFilterContract.filter);
declare const contextMenuFilterContract: ContextMenuCommand;
expectType<((context: MenuCommandContext<any>) => boolean | Promise<boolean>) | undefined>(
	contextMenuFilterContract.filter,
);
declare const entryPointFilterContract: EntryPointCommand;
expectType<((context: EntryPointContext) => boolean | Promise<boolean>) | undefined>(entryPointFilterContract.filter);

const lowercaseOptionContract = {
	username: createStringOption({
		description: 'User name',
		required: true,
	}),
	page: createIntegerOption({
		description: 'Page',
		required: false,
	}),
} as const;

Options(lowercaseOptionContract)(class LowercaseOptionsCommand {});

declare function lowercaseOptionsCommandContext(): CommandContext<typeof lowercaseOptionContract>;
expectType<string>(lowercaseOptionsCommandContext().options.username);
expectType<number | undefined>(lowercaseOptionsCommandContext().options.page);

Options({
	// @ts-expect-error option record keys must be lowercase
	UserName: createStringOption({
		description: 'User name',
	}),
});

Options([ContractSubCommand])(class ArrayOptionsCommand {});

class ContractComponent extends ComponentCommand {
	componentType = 'Button' as const;
	customId = 'contract-component';
	run() {}
}

class ContractModal extends ModalCommand {
	customId = 'contract-modal';
	run() {}
}

const componentDefaultsContract = {
	components: {
		defaults: {
			onInternalError(_client, component, error) {
				expectType<ComponentCommand>(component);
				expectType<unknown | undefined>(error);
			},
		},
	},
} satisfies ClientOptions;
expectType<ClientOptions>(componentDefaultsContract);

const modalDefaultsContract = {
	modals: {
		defaults: {
			onInternalError(_client, modal, error) {
				expectType<ModalCommand>(modal);
				expectType<unknown | undefined>(error);
			},
		},
	},
} satisfies ClientOptions;
expectType<ClientOptions>(modalDefaultsContract);

const radioGroupOptionContract = new RadioGroupOption({ value: 'yes', label: 'Yes' });
expectType<RadioGroupOption>(
	radioGroupOptionContract.setLabel('Absolutely').setValue('absolutely').setDescription('Confirm choice').setDefault(),
);
// @ts-expect-error RadioGroupOption requires both value and label at construction.
new RadioGroupOption({ value: 'yes' });
// @ts-expect-error RadioGroupOption requires option data at construction.
new RadioGroupOption();

const rawStringSelectOptionContract = { label: 'General', value: 'general' } satisfies APISelectMenuOption;
const stringSelectMenuContract = new StringSelectMenu().setCustomId('topics');
expectType<StringSelectMenu>(stringSelectMenuContract.addOption(rawStringSelectOptionContract));
expectType<StringSelectMenu>(stringSelectMenuContract.addOption([rawStringSelectOptionContract]));
expectType<StringSelectMenu>(stringSelectMenuContract.setOptions([rawStringSelectOptionContract]));
expectType<StringSelectMenu>(
	stringSelectMenuContract.setOptions(new StringSelectOption({ label: 'News', value: 'news' }), rawStringSelectOptionContract),
);

class ContractCacheResource extends BaseResource<{ id: string }, { id: string }> {
	namespace = 'contract-cache';
}

type AuthMiddleware = MiddlewareContext<{ userId: string }, CommandContext>;
type AuditMiddleware = MiddlewareContext<undefined, CommandContext>;

const ledgerKey = createSharedKey('ledger');
const combinedSharedKey = createSharedKey<{ fromClient: 'combined-client' }>()('combined-shared');
const functionSharedKey = createSharedKey<() => 'shared-fn'>()('shared-fn');
const heartbeatPayload: GatewaySendPayload = { op: GatewayOpcodes.Heartbeat, d: null };
expectType<GatewaySendPayload>(heartbeatPayload);
expectType<number>(GatewayIntentBits.Guilds);
expectType<PluginOrderOpt>(PluginOrder.Before);
expectType<PluginOrderOpt>(PluginOrder.After);
expectType<PluginOrderOpt>(10);
expectType<PluginDiagnosticCode>('unknown-intent-bits');

type PluginContextIncludesMessages = MessageStructure extends PluginContextInteraction ? true : false;
expectType<true>(true as PluginContextIncludesMessages);

const workerManagerInfo = {
	session_start_limit: {
		max_concurrency: 1,
		remaining: 1000,
		reset_after: 0,
		total: 1000,
	},
	shards: 1,
	url: 'wss://gateway.discord.gg',
};

const gatewayPresence = {
	activities: [],
	afk: false,
	since: null,
	status: PresenceUpdateStatus.Online,
} satisfies ReturnType<NonNullable<ShardManagerOptions['presence']>>;

const standaloneShardPresence = ((_shardId: number) => gatewayPresence) satisfies NonNullable<
	ShardManagerOptions['presence']
>;

expectType<NonNullable<ShardManagerOptions['presence']>>(standaloneShardPresence);

// @ts-expect-error standalone ShardManager presence no longer receives a worker id.
const standaloneShardPresenceWithWorkerId = ((_shardId: number, _workerId: number) => gatewayPresence) satisfies NonNullable<
	ShardManagerOptions['presence']
>;

expectType<NonNullable<WorkerManagerOptions['presence']>>((_shardId: number, _workerId: number) => gatewayPresence);

const workerAllowConnectWithoutPresence = {
	type: 'ALLOW_CONNECT',
	shardId: 0,
} satisfies ManagerAllowConnect;
expectType<ManagerAllowConnect>(workerAllowConnectWithoutPresence);

const workerAllowConnectWithUndefinedPresence = {
	type: 'ALLOW_CONNECT',
	shardId: 0,
	presence: undefined,
} satisfies ManagerAllowConnect;
expectType<ManagerAllowConnect>(workerAllowConnectWithUndefinedPresence);

const workerAllowConnectReshardingWithoutPresence = {
	type: 'ALLOW_CONNECT_RESHARDING',
	shardId: 0,
} satisfies ManagerAllowConnectResharding;
expectType<ManagerAllowConnectResharding>(workerAllowConnectReshardingWithoutPresence);

const workerAllowConnectReshardingWithUndefinedPresence = {
	type: 'ALLOW_CONNECT_RESHARDING',
	shardId: 0,
	presence: undefined,
} satisfies ManagerAllowConnectResharding;
expectType<ManagerAllowConnectResharding>(workerAllowConnectReshardingWithUndefinedPresence);

const customWorkerManagerOptions = {
	mode: 'custom',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
	adapter: {
		postMessage() {},
		spawn() {},
	},
} satisfies WorkerManagerOptions;
expectType<WorkerManagerOptions>(customWorkerManagerOptions);
new WorkerManager(customWorkerManagerOptions);

const customWorkerManagerOptionsWithPath = {
	mode: 'custom',
	path: 'worker.js',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
	adapter: {
		postMessage() {},
		spawn() {},
	},
} satisfies WorkerManagerOptions;
expectType<WorkerManagerOptions>(customWorkerManagerOptionsWithPath);
new WorkerManager(customWorkerManagerOptionsWithPath);

const threadedWorkerManagerOptions = {
	mode: 'threads',
	path: 'worker.js',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
} satisfies WorkerManagerOptions;
expectType<WorkerManagerOptions>(threadedWorkerManagerOptions);
new WorkerManager(threadedWorkerManagerOptions);

const clusteredWorkerManagerOptions = {
	mode: 'clusters',
	path: 'worker.js',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
} satisfies WorkerManagerOptions;
expectType<WorkerManagerOptions>(clusteredWorkerManagerOptions);
new WorkerManager(clusteredWorkerManagerOptions);

// @ts-expect-error custom worker mode requires an adapter.
const customWorkerManagerOptionsWithoutAdapter: WorkerManagerOptions = {
	mode: 'custom',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
};

// @ts-expect-error thread worker mode requires a worker path.
const threadedWorkerManagerOptionsWithoutPath: WorkerManagerOptions = {
	mode: 'threads',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
};

// @ts-expect-error cluster worker mode requires a worker path.
const clusteredWorkerManagerOptionsWithoutPath: WorkerManagerOptions = {
	mode: 'clusters',
	token: 'token',
	intents: GatewayIntentBits.Guilds,
	info: workerManagerInfo,
};

const storage = createPlugin({
	name: 'storage',
	meta: { label: 'primary' },
	client: {
		storage: () => ({ connected: true }),
	},
});

const queuesRegistry = new QueuesRegistry();
const queuesPlugin = createPlugin({
	name: '@slipher/queues',
	registry: queuesRegistry,
	client: {
		queues: () => queuesRegistry,
	},
});

const cooldownManager = new CooldownManager();
const cooldownPlugin = createPlugin({
	name: '@slipher/cooldowns',
	manager: cooldownManager,
});

createPlugin({
	name: 'invalid-reserved-extra',
	// @ts-expect-error reserved lifecycle fields keep the Seyfert plugin contract
	setup: 'not-a-function',
});

const economy = createPlugin({
	name: 'economy',
	imports: [storage],
	requires: ['plugin:storage', { req: 'plugin:cache', optional: true }],
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
		expectType<boolean>(api.has('plugin:storage'));
		api.gateway.addIntents('Guilds');
		api.gateway.wrapPayload(({ client, payload, shardId }) => {
			expectType<number>(shardId);
			expectType<unknown>(client.shared.get(ledgerKey));
			return payload;
		}, { order: PluginOrder.After });
		const disposeRestObserver = api.rest.observe({
			onRequest(payload) {
				expectType<Readonly<{ method: 'GET' | 'DELETE' | 'PUT' | 'POST' | 'PATCH'; url: `/${string}` }>>(
					payload,
				);
			},
			onSuccess(payload) {
				expectType<Response>(payload.response);
			},
			onFail(payload) {
				expectType<unknown>(payload.error);
				expectType<number | undefined>(payload.statusCode);
			},
			onRatelimit(payload) {
				expectType<Response>(payload.response);
			},
		}, PluginOrder.Before);
		expectType<() => void>(disposeRestObserver);
		api.autocomplete.wrap(async ({ command, interaction, optionsResolver }, next) => {
			expectType<string | undefined>(command?.name);
			expectType<unknown>(interaction);
			expectType<string>(optionsResolver.fullCommandName);
			await next();
		}, { order: 1 });
		api.shared.set(ledgerKey, () => new LedgerService(), {
			dispose(value) {
				expectType<LedgerService>(value);
			},
			override: true,
		});
		api.shared.remove(ledgerKey, 'legacy-ledger');
		api.commands.add(ContractCommand);
		api.commands.add(ContractCommand, { override: true });
		api.commands.add(ContractCommand, { guilds: ['guild-1'] });
		const disposeObserver = api.commands.observe({
			onBeforeOptions(context) {
				expectType<CommandContext>(context);
			},
			onMiddlewaresError(context, error, metadata) {
				expectType<PluginCommandObserverContext>(context);
				expectType<string>(error);
				expectType<{ middleware: string; scope: 'global' | 'command' }>(metadata);
			},
			onRunError(context, error) {
				expectType<PluginCommandObserverContext>(context);
				expectType<unknown>(error);
			},
			onInternalError(client, command, error) {
				expectType<unknown>(client);
				expectType<unknown>(command);
				expectType<unknown>(error);
			},
		}, { order: PluginOrder.After });
		expectType<() => void>(disposeObserver);
		api.components.add(ContractComponent);
		api.components.add(ContractComponent, { override: true });
		api.components.remove('contract-component');
		api.modals.add(ContractModal);
		api.modals.add(ContractModal, { override: true });
		api.commands.add(new ContractCommand());
		api.components.add(new ContractComponent());
		api.modals.add(new ContractModal());
		api.handlers.create((Ctor, next, metadata) => {
			expectType<PluginHandlerKind>(metadata.kind);
			expectType<unknown>(Ctor);
			return next();
		}, { kinds: ['command', 'component', 'modal'], order: PluginOrder.Before });
		api.handlers.transform((instance, metadata) => {
			expectType<PluginHandlerKind>(metadata.kind);
			return instance;
		}, { kinds: ['command'], order: PluginOrder.After });
		api.modals.remove('contract-modal');
		const disposeCommandsLoaded = api.events.once('commandsLoaded', metadata => {
			expectType<number>(metadata.total);
		});
		expectType<() => void>(disposeCommandsLoaded);
		const disposeComponentsLoaded = api.events.on('componentsLoaded', metadata => {
			expectType<number>(metadata.total);
		}, { order: PluginOrder.Before });
		expectType<() => void>(disposeComponentsLoaded);
		const disposeAny = api.events.onAny((name, ...payload) => {
			expectType<string>(name);
			expectType<unknown[]>(payload);
		}, { order: PluginOrder.After });
		expectType<() => void>(disposeAny);
		const disposeErrors = api.events.onError((error, name) => {
			expectType<unknown>(error);
			expectType<string>(name);
		}, { order: PluginOrder.Before });
		expectType<() => void>(disposeErrors);
		api.events.on('commandsLoaded', (metadata, client) => {
			expectType<void | Promise<void>>(
				client.events.emit('commandsLoaded', {
					kind: metadata.kind,
					total: metadata.total,
					items: metadata.items,
					plugin: metadata.plugin,
				}),
			);
		});
		expectType<void | Promise<void>>(
			new Client({ plugins: [] }).events.emit('commandsLoaded', {
				kind: 'commands',
				total: 0,
				items: [],
				plugin: { total: 0, sources: {} },
			}),
		);
		expectType<void>(api.langs.contribute('en-US', { balance: 'Balance' }, { prefix: 'plugins.economy' }));
		api.cache.resource('contractCache', ContractCacheResource, {
			intents: ['Guilds', GatewayIntentBits.GuildMembers],
			onPacket(event, cache) {
				expectType<GatewayDispatchPayload>(event);
				expectType<Cache>(cache);
			},
		});
		const disposeReadyHook = api.hooks.tap('plugins:ready', client => {
			expectType<unknown>(client.plugins);
		}, { order: PluginOrder.After });
		expectType<() => void>(disposeReadyHook);
		api.hooks.tap('commands:beforeLoad', (client, dir) => {
			expectType<unknown>(client.commands);
			expectType<string | undefined>(dir);
		});
		api.hooks.tap('commands:afterLoad', metadata => {
			expectType<'commands'>(metadata.kind);
		});
		api.hooks.tap('components:afterLoad', metadata => {
			expectType<'components'>(metadata.kind);
		});
		api.hooks.tap('client:close', client => {
			expectType<unknown>(client.plugins);
		});
		api.hooks.tap('economy:refresh', ledger => {
			expectType<LedgerService>(ledger);
		});
		api.options.set({ allowedMentions: { parse: [] } });
	},
	setup(client) {
		expectType<boolean>(client.storage.connected);
		client.economy.addCoins('user', 1);
	},
});

createPlugin({
	name: 'missing-langs-prefix',
	register(api) {
		// @ts-expect-error locale prefix is required for lang contributions
		api.langs.contribute('en-US', { balance: 'Balance' });
	},
});

const observer: PluginCommandObserver = {
	onAfterRun(context, error) {
		expectType<PluginCommandObserverContext>(context);
		expectType<unknown | undefined>(error);
	},
};
expectType<PluginCommandObserver>(observer);

const auth: SeyfertPlugin<{}, {}, readonly [], { auth: AuthMiddleware; audit: AuditMiddleware }> = createPlugin({
	name: 'auth',
	register(api) {
		api.middlewares.add('auth', (({ next }) => next({ userId: '1' })) as AuthMiddleware);
		api.middlewares.add('audit', (({ next }) => next()) as AuditMiddleware);
	},
});

const combinedImport = createPlugin({
	name: 'combined-import',
	client: {
		importedCounter() {
			return { count: 1 as const };
		},
	},
	ctx: {
		importedCtx(_interaction, client) {
			expectType<1>(client.importedCounter.count);
			return { importedCtx: true as const };
		},
	},
});

const combinedAudit = createMiddleware<{ auditId: string }, CommandContext>(({ context, next }) => {
	expectType<CommandContext>(context);
	next({ auditId: 'audit' });
	// @ts-expect-error audit middleware metadata requires a string id
	next({ auditId: 1 });
});

const combinedAtomic = createPlugin({
	name: 'combined-atomic',
	imports: [combinedImport],
	meta: { kind: 'atomic', stage: 2 } as const,
	client: {
		combinedClient(client) {
			expectType<1>(client.importedCounter.count);
			// @ts-expect-error client factories see imports, not their own plugin extensions
			expectType<never>(client.combinedClient);
			// @ts-expect-error imported extension does not expose missing members
			expectType<never>(client.importedCounter.missing);
			return { source: 'combined-client' as const, importedCount: client.importedCounter.count };
		},
	},
	ctx: {
		combinedCtx(interaction, client) {
			expectType<PluginContextInteraction>(interaction);
			expectType<1>(client.importedCounter.count);
			expectType<'combined-client'>(client.combinedClient.source);
			// @ts-expect-error own ctx extension is not available while constructing ctx fragments
			expectType<never>(client.combinedCtx);
			return { source: client.combinedClient.source, importedCount: client.importedCounter.count };
		},
	},
	middlewares: {
		combinedAudit,
		combinedEmpty: createMiddleware<undefined, CommandContext>(({ next }) => next()),
	},
	globalMiddlewares: ['combinedAudit'],
	register(api) {
		api.middlewares.add('combinedAudit', combinedAudit);
		api.shared.set(combinedSharedKey, client => {
			expectType<1>(client.importedCounter.count);
			expectType<'combined-client'>(client.combinedClient.source);
			return { fromClient: client.combinedClient.source };
		});
		api.shared.set(
			functionSharedKey,
			client => {
				expectType<1>(client.importedCounter.count);
				expectType<'combined-client'>(client.combinedClient.source);
				return () => 'shared-fn' as const;
			},
			{
				async dispose(value) {
					expectType<() => 'shared-fn'>(value);
				},
			},
		);
		// @ts-expect-error shared function values must be returned from a factory
		api.shared.set(functionSharedKey, () => 'shared-fn');
		api.hooks.tap('plugins:ready', client => {
			expectType<'combined-client'>(client.combinedClient.source);
		});
		api.hooks.tap('commands:beforeLoad', (client, dir) => {
			expectType<'combined-client'>(client.combinedClient.source);
			expectType<string | undefined>(dir);
		});
		api.hooks.tap('client:close', client => {
			expectType<'combined-client'>(client.combinedClient.source);
		});
	},
	setup(client, api) {
		expectType<1>(client.importedCounter.count);
		expectType<'combined-client'>(client.combinedClient.source);
		expectType<boolean | undefined>(api?.has('plugin:combined-import'));
		// @ts-expect-error setup client extension keeps exact shape
		expectType<never>(client.combinedClient.missing);
	},
	teardown(client, api) {
		expectType<1>(client.importedCounter.count);
		expectType<'combined-client'>(client.combinedClient.source);
		expectType<boolean | undefined>(api?.shared.has(combinedSharedKey));
		expectType<boolean | undefined>(api?.has('plugin:combined-import'));
	},
});

const noMetaPlugin = createPlugin({
	name: 'no-meta',
});
// @ts-expect-error plugins without meta should not expose a meta property
expectType<never>(noMetaPlugin.meta);

const optionsPlugin: SeyfertPlugin = {
	name: 'options',
	options(current) {
		expectType<Readonly<SeyfertPluginOptions>>(current);
		return { allowedMentions: { parse: [] } };
	},
};

const configuredPlugin = definePlugin((options: { currency: 'coin' | 'gem' }) =>
	createPlugin({
		name: 'configured',
		client: {
			configuredEconomy: () => ({ currency: options.currency }),
		},
	}),
)({ currency: 'coin' });
expectType<'coin' | 'gem'>({} as PluginExtensionOf<typeof configuredPlugin>['configuredEconomy']['currency']);

const defaultedPluginFactory = definePlugin({
	defaults: { prefix: 'default', enabled: true },
	validate(options) {
		expectType<string>(options.prefix);
		expectType<boolean>(options.enabled);
	},
	factory(options) {
		return createPlugin({
			name: 'defaulted-configured',
			client: {
				defaultedConfig: () => ({ prefix: options.prefix, enabled: options.enabled }),
			},
		});
	},
});
const defaultedPlugin = defaultedPluginFactory();
const overriddenDefaultedPlugin = defaultedPluginFactory({ prefix: 'override' });
expectType<string>({} as PluginExtensionOf<typeof defaultedPlugin>['defaultedConfig']['prefix']);
expectType<boolean>({} as PluginExtensionOf<typeof overriddenDefaultedPlugin>['defaultedConfig']['enabled']);

const range: SemverRange = '^1.2.0';
const capabilityRequirementPlugin = createPlugin({
	name: 'capability-requirement',
	instanceId: 'primary',
	requires: [
		{ req: 'plugin:storage', range },
		{ req: 'plugin:storage#primary', range: '>=1.0.0', optional: true },
		{ capability: ledgerKey },
		{ capability: combinedSharedKey, optional: true },
	],
});

const plugins = definePlugins(economy, storage, auth, combinedAtomic, combinedImport, optionsPlugin);
const localPlugins = definePlugins(configuredPlugin, defaultedPlugin, capabilityRequirementPlugin);
const arrayPlugins = definePlugins([economy, storage, combinedAtomic]);
const emptyPlugins = definePlugins();

declare module 'seyfert' {
	interface SeyfertRegistry {
		plugins: typeof plugins;
		client: Client<true>;
		middlewares: { localAudit: typeof combinedAudit };
		langs: {
			commands: {
				groups: {
					admin: {
						name: string;
						description: string;
					};
				};
			};
		};
	}

	interface RegisteredPluginShared {
		ledger: LedgerService;
	}

	interface SeyfertPluginHooks {
		'economy:refresh': [ledger: LedgerService];
	}
}

declare function commandContext(): CommandContext;
declare function authCommandContext(): CommandContext<{}, 'auth'>;
declare function componentContext(): ComponentContext;
declare function modalContext(): ModalContext;
declare function menuCommandContext(): MenuCommandContext<any>;
declare function entryPointContext(): EntryPointContext;
declare const messageWithEmbeds: MessageStructure;
declare const rawApiEmbed: APIEmbed;

expectType<Promise<void>>(commandContext().write({ content: 'Done!' }));
expectType<Promise<void>>(commandContext().write({ embeds: messageWithEmbeds.embeds }));
expectType<Promise<void>>(commandContext().write({ embeds: [new Embed(), rawApiEmbed] }));
expectType<Promise<void>>(commandContext().editOrReply({ content: 'Done!' }));
expectType<Promise<void>>(commandContext().ephemeral({ content: 'Done!' }, false));
expectType<Promise<void>>(commandContext().write({ content: 'Done!' }, false));
expectType<Promise<void>>(commandContext().editOrReply({ content: 'Done!' }, false));
expectType<Promise<WebhookMessageStructure>>(commandContext().write({ content: 'Done!' }, true));
expectType<Promise<WebhookMessageStructure>>(commandContext().editOrReply({ content: 'Done!' }, true));
expectType<Promise<WebhookMessageStructure>>(commandContext().ephemeral({ content: 'Done!' }, true));
expectType<Promise<WebhookMessageStructure>>(componentContext().ephemeral({ content: 'Done!' }, true));
expectType<Promise<WebhookMessageStructure>>(modalContext().ephemeral({ content: 'Done!' }, true));
expectType<Promise<WebhookMessageStructure>>(menuCommandContext().ephemeral({ content: 'Done!' }, true));
expectType<Promise<WebhookMessageStructure>>(entryPointContext().ephemeral({ content: 'Done!' }, true));

expectType<Promise<GuildMemberStructure | undefined>>(commandContext().fetchMember());
expectType<Promise<GuildMemberStructure | undefined>>(commandContext().fetchMember('flow'));
expectType<Promise<GuildMemberStructure | undefined>>(commandContext().fetchMember('rest'));
expectType<ReturnCache<GuildMemberStructure | undefined>>(commandContext().fetchMember('cache'));

type GuildCommandChannel = AllGuildChannels | BaseGuildChannelStructure;
expectType<true>(true as Equal<AllGuildChannels extends GuildCommandChannel ? true : false, true>);
expectType<true>(true as Equal<BaseGuildChannelStructure extends GuildCommandChannel ? true : false, true>);
expectType<true>(true as Equal<DMChannelStructure extends GuildCommandChannel ? true : false, false>);
expectType<true>(true as Equal<BaseChannelStructure extends GuildCommandChannel ? true : false, false>);

const guildCommandContext = commandContext();
if (guildCommandContext.inGuild()) {
	const channel = guildCommandContext.channel();
	expectType<true>(true as Equal<typeof channel, Promise<GuildCommandChannel>>);

	const cachedChannel = guildCommandContext.channel('cache');
	expectType<true>(true as Equal<typeof cachedChannel, ReturnCache<GuildCommandChannel>>);

	expectType<Promise<GuildMemberStructure>>(guildCommandContext.fetchMember());
	expectType<Promise<GuildMemberStructure>>(guildCommandContext.fetchMember('flow'));
	expectType<Promise<GuildMemberStructure>>(guildCommandContext.fetchMember('rest'));
	expectType<ReturnCache<GuildMemberStructure | undefined>>(guildCommandContext.fetchMember('cache'));
}

expectType<SeyfertPlugin<any, any, any, any>>(economy);
// @ts-expect-error SeyfertPlugin has only four generic slots
type NoFifthPluginSlot = SeyfertPlugin<{}, {}, readonly [], {}, {}>;
expectType<readonly [typeof economy, typeof storage, typeof auth, typeof combinedAtomic, typeof combinedImport, typeof optionsPlugin]>(plugins);
expectType<readonly [typeof configuredPlugin, typeof defaultedPlugin, typeof capabilityRequirementPlugin]>(localPlugins);
expectType<readonly [typeof economy, typeof storage, typeof combinedAtomic]>(arrayPlugins);
expectType<readonly []>(emptyPlugins);
expectType<string>(storage.meta.label);
expectType<'atomic'>(combinedAtomic.meta.kind);
// @ts-expect-error plugins without meta should not expose a meta property
expectType<never>(noMetaPlugin.meta);
expectType<QueuesRegistry>(queuesPlugin.registry);
expectType<QueuesRegistry>({} as PluginExtensionOf<typeof queuesPlugin>['queues']);
expectType<CooldownManager>(cooldownPlugin.manager);
expectType<SharedKey<LedgerService, 'ledger'>>(ledgerKey);
expectType<SharedKey<{ fromClient: 'combined-client' }, 'combined-shared'>>(combinedSharedKey);
expectType<SharedKey<() => 'shared-fn', 'shared-fn'>>(functionSharedKey);
expectType<EconomyApi>({} as PluginExtensionOf<typeof economy>['economy']);
expectType<{ add(amount: number): void }>({} as PluginContextOf<typeof economy>['wallet']);
expectType<false>(false as IsAny<PluginExtensionOf<typeof combinedAtomic>['combinedClient']>);
expectType<false>(false as IsAny<PluginContextOf<typeof combinedAtomic>['combinedCtx']>);
expectType<'combined-client'>({} as PluginExtensionOf<typeof combinedAtomic>['combinedClient']['source']);
expectType<'combined-client'>({} as PluginContextOf<typeof combinedAtomic>['combinedCtx']['source']);
expectType<EconomyApi>({} as PluginUsingClient<typeof plugins>['economy']);
expectType<'combined-client'>({} as PluginUsingClient<typeof plugins>['combinedClient']['source']);
expectType<{ add(amount: number): void }>({} as PluginContextMapOf<typeof plugins>['wallet']);
expectType<'combined-client'>({} as PluginContextMapOf<typeof plugins>['combinedCtx']['source']);
expectType<AuthMiddleware>({} as PluginMiddlewaresMapOf<typeof plugins>['auth']);
expectType<typeof combinedAudit>({} as PluginMiddlewaresMapOf<typeof plugins>['combinedAudit']);
expectType<AuthMiddleware>({} as RegisteredPluginMiddlewares['auth']);
expectType<typeof combinedAudit>({} as RegisteredPluginMiddlewares['combinedAudit']);
expectType<{ auth: { userId: string } }>({} as CommandMetadata<'auth'>);
expectType<{ combinedAudit: { auditId: string } }>({} as CommandMetadata<'combinedAudit'>);
expectType<{ auth: { userId: string } }>({} as CommandMetadata<'auth' | 'audit'>);
expectType<{}>({} as CommandMetadata<'audit'>);
// @ts-expect-error middlewares without metadata payload are omitted from command metadata
({} as CommandMetadata<'audit'>).audit;
// @ts-expect-error middlewares without metadata payload are omitted even when mixed with payload middlewares
({} as CommandMetadata<'auth' | 'audit'>).audit;
expectType<{ userId: string }>({} as MetadataMiddleware<AuthMiddleware>);
expectType<{ userId: string }>({} as MetadataMiddleware<RegisteredPluginMiddlewares['auth']>);
expectType<{ userId: string }>({} as MetadataMiddleware<ResolvedRegisteredMiddlewares['auth']>);
expectType<AuthMiddleware>({} as ResolvedRegisteredMiddlewares['auth']);
expectType<[LedgerService]>({} as SeyfertPluginHooks['economy:refresh']);

const commandMiddlewares = middlewares('auth', 'combinedAudit');
expectType<true>(true as Equal<typeof commandMiddlewares, readonly ['auth', 'combinedAudit']>);
expectType<true>(true as Equal<InferMiddlewares<typeof commandMiddlewares>, 'auth' | 'combinedAudit'>);
expectType<{ auth: { userId: string }; combinedAudit: { auditId: string } }>(
	{} as CommandMetadata<typeof commandMiddlewares>,
);
expectType<ReturnType<typeof Middlewares>>(Middlewares(commandMiddlewares));
declare function typedMiddlewareCommandContext(): CommandContext<{}, InferMiddlewares<typeof commandMiddlewares>>;
expectType<{ userId: string }>(typedMiddlewareCommandContext().metadata.auth);
expectType<{ auditId: string }>(typedMiddlewareCommandContext().metadata.combinedAudit);
// @ts-expect-error middleware tuple helper only accepts registered middleware keys
middlewares('missing');

const client = new Client({ plugins });
client.setServices({ middlewares: { localAudit: combinedAudit } });
client.setServices({
	middlewares: {
		auth: (({ next }) => next({ userId: '1' })) as AuthMiddleware,
		combinedAudit,
	},
});
// @ts-expect-error setServices middlewares only accepts registered middleware keys when the registry is typed
client.setServices({ middlewares: { missing: combinedAudit } });
// @ts-expect-error setServices preserves the registered middleware value type for each key
client.setServices({ middlewares: { auth: combinedAudit } });
const fallbackMiddlewares: ClientMiddlewares<{}> = {
	anyRuntimeMiddleware: (({ next }) => next(undefined)) as MiddlewareContext,
};
expectType<MiddlewareContext>(fallbackMiddlewares.anyRuntimeMiddleware);
// @ts-expect-error fallback middleware values must still be middleware functions
const invalidFallbackMiddlewares: ClientMiddlewares<{}> = { anyRuntimeMiddleware: 'not-a-middleware' };
client.economy.addCoins('user', 2);
const ledger = client.shared.get(ledgerKey);
expectType<LedgerService | undefined>(ledger);
expectType<LedgerService>(client.shared.unwrap(ledgerKey));
expectType<LedgerService | undefined>(client.shared.get('ledger'));
expectType<RegisteredPluginShared['ledger'] | undefined>(client.shared.get('ledger'));

const localClient = new Client({ plugins: localPlugins });
expectType<'coin' | 'gem'>(localClient.configuredEconomy.currency);
expectType<string>(localClient.defaultedConfig.prefix);

declare const explicitLocalClient: Client<typeof localPlugins>;
expectType<'coin' | 'gem'>(explicitLocalClient.configuredEconomy.currency);
expectType<boolean>(explicitLocalClient.defaultedConfig.enabled);

const ctx = commandContext();
ctx.client.economy.addCoins('user', 3);
ctx.wallet.add(3);
expectType<number>(ctx.client.gateway.latency);
expectType<typeof combinedAudit>({} as ResolvedRegisteredMiddlewares['localAudit']);
expectType<ReturnType<typeof Middlewares>>(Middlewares(['auth']));
expectType<ReturnType<typeof Middlewares>>(Middlewares(['combinedAudit']));
// @ts-expect-error plugin middlewares must be registered before they can be referenced
Middlewares(['missing']);
expectType<{ userId: string }>(authCommandContext().metadata.auth);
