import { ApplicationCommandTypes } from '../../../../discordeno/mod.ts';
import { OptionBased } from './ApplicationCommandOption.ts';
import type { Localization, PermissionStrings } from '../../../../discordeno/mod.ts';
import { mix } from "../mixer/mod.ts";
import { CreateApplicationCommand } from "../../../Session.ts"

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
