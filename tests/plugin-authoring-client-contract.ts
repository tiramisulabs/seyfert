import {
	type AutocompleteCallback,
	type AutocompleteInteraction,
	type BanOptions,
	type BaseInteraction,
	Client,
	type Command,
	type CommandContext,
	type ContextMenuCommand,
	type config,
	createIntegerOption,
	createNumberOption,
	createStringOption,
	type EntryPointCommand,
	type EntryPointContext,
	GatewayIntentBits,
	GuildBan,
	GuildMember,
	type GuildMemberStructure,
	type GuildRoleStructure,
	type LangInstance,
	LangsHandler,
	type MenuCommandContext,
	type MessageCommandInteraction,
	type OnAutocompleteErrorCallback,
	type RuntimeConfig,
	type RuntimeConfigHTTP,
	type ShardManager,
	type UserCommandInteraction,
	type UsingClient,
} from 'seyfert';
import type { APIRoutes } from '../lib/api/Routes';
import type { BaseClientOptions, ServicesOptions, StartOptions } from '../lib/client/base';
import { HandleCommand } from '../lib/commands/handle';
import type { BanShorter } from '../lib/common/shorters/bans';
import type { MemberShorter } from '../lib/common/shorters/members';
import type { PermissionsBitField } from '../lib/structures/extra/Permissions';

declare function expectType<T>(value: T): void;
type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? (<T>() => T extends B ? 1 : 2) extends <T>() => T extends A ? 1 : 2
			? true
			: false
		: false;

expectType<true>(true as Equal<ShardManager['options']['debug'], boolean>);
expectType<true>(true as Equal<ShardManager['options']['intents'], number>);
expectType<StartOptions['connection']['intents']>(['Guilds']);
expectType<StartOptions['connection']['intents']>([GatewayIntentBits.Guilds]);
expectType<true>(true as Equal<ReturnType<typeof config.bot>['intents'], number>);
expectType<true>(true as Equal<ReturnType<typeof config.http>['port'], number>);
const publicRuntimeConfig = {
	token: 'token',
	locations: { base: 'src' },
	intents: ['Guilds'],
} satisfies RuntimeConfig;
const publicHttpConfig = {
	token: 'token',
	applicationId: 'application-id',
	publicKey: 'public-key',
	locations: { base: 'src' },
} satisfies RuntimeConfigHTTP;
expectType<BaseClientOptions>({ getRC: () => publicRuntimeConfig });
expectType<BaseClientOptions>({ getRC: () => publicHttpConfig });
declare const handleCommandConstructor: new (client: UsingClient) => HandleCommand;
expectType<NonNullable<ServicesOptions['handleCommand']>>(handleCommandConstructor);
class ContractHandleCommand extends HandleCommand {}
expectType<ServicesOptions>({ handleCommand: ContractHandleCommand });
// @ts-expect-error handleCommand option takes a constructor, not an instance.
expectType<ServicesOptions>({ handleCommand: new ContractHandleCommand({} as UsingClient) });
type BotPermissionCheckParameters = Parameters<HandleCommand['checkBotPermissions']>;
type MenuPermissionCheckContext = Extract<
	BotPermissionCheckParameters,
	[ContextMenuCommand, unknown, PermissionsBitField]
>[1];
type MenuPermissionCheckInteraction =
	MenuPermissionCheckContext extends MenuCommandContext<infer Interaction> ? Interaction : never;
expectType<true>(true as Equal<MenuPermissionCheckInteraction, MessageCommandInteraction | UserCommandInteraction>);
declare const contractHandleCommand: HandleCommand;
declare const contractCommand: Command;
declare const contractCommandContext: CommandContext;
declare const contractMenuCommand: ContextMenuCommand;
declare const contractMenuContext: MenuCommandContext<UserCommandInteraction>;
declare const contractEntryPointCommand: EntryPointCommand;
declare const contractEntryPointContext: EntryPointContext;
declare const contractPermissions: PermissionsBitField;
declare const contractAnyCommand: Command | ContextMenuCommand | EntryPointCommand;
declare const contractAnyContext:
	| CommandContext
	| MenuCommandContext<MessageCommandInteraction | UserCommandInteraction>
	| EntryPointContext;
contractHandleCommand.checkBotPermissions(contractCommand, contractCommandContext, contractPermissions);
contractHandleCommand.checkBotPermissions(contractMenuCommand, contractMenuContext, contractPermissions);
contractHandleCommand.checkBotPermissions(contractEntryPointCommand, contractEntryPointContext, contractPermissions);
contractHandleCommand.checkBotPermissions(contractAnyCommand, contractAnyContext, contractPermissions);
// @ts-expect-error entry-point commands require an EntryPointContext.
contractHandleCommand.checkBotPermissions(contractEntryPointCommand, contractCommandContext, contractPermissions);
// @ts-expect-error context-menu commands require a MenuCommandContext.
contractHandleCommand.checkBotPermissions(contractMenuCommand, contractEntryPointContext, contractPermissions);
expectType<true>(
	true as Equal<Awaited<ReturnType<GuildMemberStructure['roles']['highest']>>, GuildRoleStructure | undefined>,
);
expectType<Promise<GuildRoleStructure>>(({} as GuildRoleStructure).edit({ name: 'moderators' }, 'sync role name'));
expectType<true>(true as Equal<BanOptions, { deleteMessageSeconds?: number; reason?: string }>);
declare const guildMember: GuildMember;
expectType<readonly string[]>(guildMember.roles.keys);
// @ts-expect-error GuildMember.roles.keys reflects a frozen runtime array.
guildMember.roles.keys.push('role');
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
declare const memberSearchClient: { members: MemberShorter; proxy: APIRoutes };
expectType<Promise<GuildMemberStructure[]>>(memberSearchClient.members.search('123', { query: 'alice', limit: 1 }));
expectType<Promise<GuildMemberStructure[]>>(guildMemberMethods.search({ query: 'alice', limit: 1 }));
// @ts-expect-error BaseGuildMember.methods().ban no longer accepts positional body and reason arguments.
guildMemberMethods.ban('123', { delete_message_seconds: 60 }, 'cleanup');
// @ts-expect-error member search requires query options
memberSearchClient.members.search('123');
// @ts-expect-error guild-bound member search requires query options
guildMemberMethods.search();
// @ts-expect-error raw REST member search requires query args
memberSearchClient.proxy.guilds('123').members.search.get({});

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

const inlineLangInstance: LangInstance = {
	name: 'inline.ts',
	file: { default: { greeting: 'Hello' } } as LangInstance['file'],
};
expectType<LangInstance>(inlineLangInstance);

const langsHandlerContract = new LangsHandler({ warn() {} } as never);
expectType<boolean>(langsHandlerContract.preferGuildLocale);
new Client().setServices({ langs: { preferGuildLocale: true } });

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
