import { ApplicationCommandTypes } from '../../../../discordeno/mod.ts';
import { OptionBased, ApplicationCommandOption } from './ApplicationCommandOption.ts';
import type { Localization, PermissionStrings } from '../../../../discordeno/mod.ts';
import { mix } from "../mixer/mod.ts";

export abstract class ApplicationCommandBuilder implements CreateApplicationCommand {
    protected constructor(
        // required
        public type: ApplicationCommandTypes = ApplicationCommandTypes.ChatInput,
        public name = '',
        public description = '',
        // non-required
        public defaultMemberPermissions?: PermissionStrings[],
        // etc
        public nameLocalizations?: Localization,
        public descriptionLocalizations?: Localization,
        public dmPermission = true,
    ) {
        this.type = type;
        this.name = name;
        this.description = description;
        this.defaultMemberPermissions = defaultMemberPermissions;
        this.nameLocalizations = nameLocalizations;
        this.descriptionLocalizations = descriptionLocalizations;
        this.dmPermission = dmPermission;
    }

    public setType(type: ApplicationCommandTypes) {
        return (this.type = type), this;
    }

    public setName(name: string) {
        return (this.name = name), this;
    }

    public setDescription(description: string) {
        return (this.description = description), this;
    }

    public setDefaultMemberPermission(perm: PermissionStrings[]) {
        return (this.defaultMemberPermissions = perm), this;
    }

    public setNameLocalizations(l: Localization) {
        return (this.nameLocalizations = l), this;
    }

    public setDescriptionLocalizations(l: Localization) {
        return (this.descriptionLocalizations = l), this;
    }

    public setDmPermission(perm: boolean) {
        return (this.dmPermission = perm), this;
    }
}

export class MessageApplicationCommandBuilder {
    public constructor(
        // required
        public type?: ApplicationCommandTypes,
        public name?: string,
    ) {
        this.type = ApplicationCommandTypes.Message;
        this.name = name;
    }

    public setName(name: string) {
        return (this.name = name), this;
    }

    public toJSON(): { name: string; type: ApplicationCommandTypes.Message } {
        if (!this.name) throw new TypeError('Propety \'name\' is required');

        return {
            type: ApplicationCommandTypes.Message,
            name: this.name,
        };
    }
}

@mix(ApplicationCommandBuilder, OptionBased)
export class ChatInputApplicationCommandBuilder {
    public type: ApplicationCommandTypes.ChatInput = ApplicationCommandTypes.ChatInput;

    public toJSON(): CreateApplicationCommand {
        if (!this.type) throw new TypeError('Propety \'type\' is required');
        if (!this.name) throw new TypeError('Propety \'name\' is required');
        if (!this.description) {
            throw new TypeError('Propety \'description\' is required');
        }

        return {
            type: ApplicationCommandTypes.ChatInput,
            name: this.name,
            description: this.description,
            options: this.options?.map((o) => o.toJSON()) ?? [],
            defaultMemberPermissions: this.defaultMemberPermissions,
            nameLocalizations: this.nameLocalizations,
            descriptionLocalizations: this.descriptionLocalizations,
            dmPermission: this.dmPermission,
        };
    }
}
export interface ChatInputApplicationCommandBuilder extends ApplicationCommandBuilder, OptionBased {
    // pass
}

/** https://discord.com/developers/docs/interactions/application-commands#endpoints-json-params */
export interface CreateApplicationCommand {
    /**
     * Name of command, 1-32 characters.
     * `ApplicationCommandTypes.ChatInput` command names must match the following regex `^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$` with the unicode flag set.
     * If there is a lowercase variant of any letters used, you must use those.
     * Characters with no lowercase variants and/or uncased letters are still allowed.
     * ApplicationCommandTypes.User` and `ApplicationCommandTypes.Message` commands may be mixed case and can include spaces.
     */
    name: string;
    /** Localization object for the `name` field. Values follow the same restrictions as `name` */
    nameLocalizations?: Localization;
    /** 1-100 character description */
    description: string;
    /** Localization object for the `description` field. Values follow the same restrictions as `description` */
    descriptionLocalizations?: Localization;
    /** Type of command, defaults `ApplicationCommandTypes.ChatInput` if not set  */
    type?: ApplicationCommandTypes;
    /** Parameters for the command */
    options?: ApplicationCommandOption[];
    /** Set of permissions represented as a bit set */
    defaultMemberPermissions?: PermissionStrings[];
    /** Indicates whether the command is available in DMs with the app, only for globally-scoped commands. By default, commands are visible. */
    dmPermission?: boolean;
  }