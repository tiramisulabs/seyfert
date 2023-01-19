import type { Localization, PermissionStrings } from '@biscuitland/api-types';
import { ApplicationCommandTypes } from '@biscuitland/api-types';
import type { CreateApplicationCommand } from '@biscuitland/core';
import { OptionBased } from './ApplicationCommandOption';
export declare abstract class ApplicationCommandBuilder {
    constructor(type?: ApplicationCommandTypes, name?: string, description?: string, defaultMemberPermissions?: PermissionStrings[], nameLocalizations?: Localization, descriptionLocalizations?: Localization, dmPermission?: boolean);
    type: ApplicationCommandTypes;
    name: string;
    description: string;
    defaultMemberPermissions?: PermissionStrings[];
    nameLocalizations?: Localization;
    descriptionLocalizations?: Localization;
    dmPermission: boolean;
    setType(type: ApplicationCommandTypes): this;
    setName(name: string): this;
    setDescription(description: string): this;
    setDefaultMemberPermission(perm: PermissionStrings[]): this;
    setNameLocalizations(l: Localization): this;
    setDescriptionLocalizations(l: Localization): this;
    setDmPermission(perm: boolean): this;
}
export declare type MessageApplicationCommandBuilderJSON = {
    name: string;
    type: ApplicationCommandTypes.Message;
};
export declare class MessageApplicationCommandBuilder {
    type: ApplicationCommandTypes;
    name?: string;
    constructor(type?: ApplicationCommandTypes, name?: string);
    setName(name: string): this;
    toJSON(): MessageApplicationCommandBuilderJSON;
}
export declare class ChatInputApplicationCommandBuilder extends ApplicationCommandBuilder {
    type: ApplicationCommandTypes.ChatInput;
    toJSON(): CreateApplicationCommand;
}
export interface ChatInputApplicationCommandBuilder extends ApplicationCommandBuilder, OptionBased {
}
