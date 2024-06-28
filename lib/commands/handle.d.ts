import { type APIApplicationCommandInteraction, type APIInteraction, type GatewayMessageCreateDispatchData, type APIApplicationCommandInteractionDataOption, ApplicationCommandOptionType } from 'discord-api-types/v10';
import { Command, type ContextOptionsResolved, type UsingClient, type CommandAutocompleteOption, type ContextMenuCommand, MenuCommandContext, CommandContext, SubCommand, type CommandOption, type MessageCommandOptionErrors } from '.';
import { AutocompleteInteraction, type ComponentInteraction, type ModalSubmitInteraction, type ChatInputCommandInteraction, type MessageCommandInteraction, type UserCommandInteraction, type __InternalReplyFunction } from '../structures';
import type { PermissionsBitField } from '../structures/extra/Permissions';
import type { MakeRequired } from '../common';
import { type MessageStructure, Transformers, type OptionResolverStructure } from '../client/transformers';
export type CommandOptionWithType = CommandOption & {
    type: ApplicationCommandOptionType;
};
export interface CommandFromContent {
    command?: Command | SubCommand;
    parent?: Command;
    fullCommandName: string;
}
export declare class HandleCommand {
    client: UsingClient;
    constructor(client: UsingClient);
    autocomplete(interaction: AutocompleteInteraction, optionsResolver: OptionResolverStructure, command?: CommandAutocompleteOption): Promise<void>;
    contextMenuMessage(command: ContextMenuCommand, interaction: MessageCommandInteraction, context: MenuCommandContext<MessageCommandInteraction>): Promise<any>;
    contextMenuUser(command: ContextMenuCommand, interaction: UserCommandInteraction, context: MenuCommandContext<UserCommandInteraction>): Promise<any>;
    chatInput(command: Command | SubCommand, interaction: ChatInputCommandInteraction, resolver: OptionResolverStructure, context: CommandContext): Promise<any>;
    modal(interaction: ModalSubmitInteraction): Promise<void>;
    messageComponent(interaction: ComponentInteraction): Promise<void>;
    interaction(body: APIInteraction, shardId: number, __reply?: __InternalReplyFunction): Promise<void>;
    message(rawMessage: GatewayMessageCreateDispatchData, shardId: number): Promise<any>;
    argsParser(content: string, _command: SubCommand | Command, _message: MessageStructure): Record<string, string>;
    resolveCommandFromContent(content: string, _prefix: string, _message: GatewayMessageCreateDispatchData): CommandFromContent & {
        argsContent?: string;
    };
    getCommandFromContent(commandRaw: string[]): CommandFromContent;
    makeResolver(...args: Parameters<(typeof Transformers)['OptionResolver']>): import("./optionresolver").OptionResolver;
    getParentMessageCommand(rawParentName: string): Command | ContextMenuCommand | undefined;
    getCommand<T extends Command | ContextMenuCommand>(data: {
        guild_id?: string;
        name: string;
    }): T | undefined;
    checkPermissions(app: PermissionsBitField, bot: bigint): false | import("../common").PermissionStrings;
    fetchChannel(_option: CommandOptionWithType, id: string): Promise<import("discord-api-types/v10").APIChannel>;
    fetchUser(_option: CommandOptionWithType, id: string): Promise<import("discord-api-types/v10").APIUser>;
    fetchMember(_option: CommandOptionWithType, id: string, guildId: string): Promise<import("discord-api-types/v10").APIGuildMember>;
    fetchRole(_option: CommandOptionWithType, id: string, guildId?: string): Promise<import("discord-api-types/v10").APIRole | undefined>;
    runGlobalMiddlewares(command: Command | ContextMenuCommand | SubCommand, context: CommandContext<{}, never> | MenuCommandContext<any>): Promise<false | {
        error?: string;
        pass?: boolean;
    } | undefined>;
    runMiddlewares(command: Command | ContextMenuCommand | SubCommand, context: CommandContext<{}, never> | MenuCommandContext<any>): Promise<false | {
        error?: string;
        pass?: boolean;
    } | undefined>;
    makeMenuCommand(body: APIApplicationCommandInteraction, shardId: number, __reply?: __InternalReplyFunction): void | {
        command: ContextMenuCommand;
        interaction: UserCommandInteraction<boolean> | MessageCommandInteraction<boolean>;
        context: MenuCommandContext<UserCommandInteraction<boolean> | MessageCommandInteraction<boolean>, never>;
    };
    runOptions(command: Command | SubCommand, context: CommandContext, resolver: OptionResolverStructure): Promise<boolean>;
    argsOptionsParser(command: Command | SubCommand, message: GatewayMessageCreateDispatchData, args: Partial<Record<string, string>>, resolved: MakeRequired<ContextOptionsResolved>): Promise<{
        errors: {
            name: string;
            error: string;
            fullError: MessageCommandOptionErrors;
        }[];
        options: APIApplicationCommandInteractionDataOption[];
    }>;
}
