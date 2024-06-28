import { type APIApplicationCommandInteractionDataOption, type APIAttachment, type APIGuildMember, type APIInteractionDataResolvedChannel, type APIInteractionGuildMember, type APIRole, type APIUser, ApplicationCommandOptionType } from 'discord-api-types/v10';
import { Attachment } from '..';
import type { MakeRequired } from '../common';
import type { AllChannels } from '../structures';
import type { Command, CommandAutocompleteOption, SubCommand } from './applications/chat';
import type { UsingClient } from './applications/shared';
import { type GuildMemberStructure, type GuildRoleStructure, type InteractionGuildMemberStructure, type UserStructure } from '../client/transformers';
export type ContextOptionsResolved = {
    members?: Record<string, APIGuildMember | Omit<APIGuildMember, 'user'> | APIInteractionGuildMember>;
    users?: Record<string, APIUser>;
    roles?: Record<string, APIRole>;
    channels?: Record<string, APIInteractionDataResolvedChannel>;
    attachments?: Record<string, APIAttachment>;
};
export declare class OptionResolver {
    private client;
    parent?: Command | undefined;
    guildId?: string | undefined;
    resolved?: ContextOptionsResolved | undefined;
    readonly options: OptionResolved[];
    hoistedOptions: OptionResolved[];
    private subCommand;
    private group;
    constructor(client: UsingClient, options: APIApplicationCommandInteractionDataOption[], parent?: Command | undefined, guildId?: string | undefined, resolved?: ContextOptionsResolved | undefined);
    get fullCommandName(): string;
    getCommand(): Command | SubCommand | undefined;
    getAutocompleteValue(): string | undefined;
    getAutocomplete(): CommandAutocompleteOption | undefined;
    getParent(): string | undefined;
    getSubCommand(): string | null;
    getGroup(): string | null;
    get(name: string): OptionResolved | undefined;
    getHoisted(name: string): OptionResolved | undefined;
    getValue(name: string): string | number | boolean | Attachment | import("..").GuildMember | import("..").BaseChannel<import("discord-api-types/v10").ChannelType> | import("..").DMChannel | import("..").CategoryChannel | import("..").InteractionGuildMember | import("..").GuildRole | import("..").User | undefined;
    private getTypedOption;
    getChannel(name: string, required?: true): AllChannels;
    getString(name: string, required?: true): string;
    transformOption(option: APIApplicationCommandInteractionDataOption, resolved?: ContextOptionsResolved): OptionResolved;
}
export interface OptionResolved {
    name: string;
    type: ApplicationCommandOptionType;
    value?: string | number | boolean;
    options?: OptionResolved[];
    user?: UserStructure;
    member?: GuildMemberStructure | InteractionGuildMemberStructure;
    attachment?: Attachment;
    channel?: AllChannels;
    role?: GuildRoleStructure;
    focused?: boolean;
}
export type OptionResolvedWithValue = MakeRequired<Pick<OptionResolved, 'name' | 'value' | 'focused'>, 'value'> & {
    type: ApplicationCommandOptionType.Boolean | ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number | ApplicationCommandOptionType.String;
};
export type OptionResolvedWithProp = Exclude<OptionResolved, {
    type: ApplicationCommandOptionType.Boolean | ApplicationCommandOptionType.Integer | ApplicationCommandOptionType.Number | ApplicationCommandOptionType.String;
}>;
