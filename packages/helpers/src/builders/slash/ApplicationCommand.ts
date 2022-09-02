import type {
	Localization,
	PermissionStrings } from '@biscuitland/api-types';
import {
	ApplicationCommandTypes
} from '@biscuitland/api-types';
import type { CreateApplicationCommand } from '@biscuitland/core';
import { OptionBased } from './ApplicationCommandOption';

export abstract class ApplicationCommandBuilder {
	constructor(
		type: ApplicationCommandTypes = ApplicationCommandTypes.ChatInput,
		name = '',
		description = '',
		defaultMemberPermissions?: PermissionStrings[],
		nameLocalizations?: Localization,
		descriptionLocalizations?: Localization,
		dmPermission = true
	) {
		this.type = type;
		this.name = name;
		this.description = description;
		this.defaultMemberPermissions = defaultMemberPermissions;
		this.nameLocalizations = nameLocalizations;
		this.descriptionLocalizations = descriptionLocalizations;
		this.dmPermission = dmPermission;
	}

	type: ApplicationCommandTypes;
	name: string;
	description: string;
	defaultMemberPermissions?: PermissionStrings[];
	nameLocalizations?: Localization;
	descriptionLocalizations?: Localization;
	dmPermission: boolean;

	setType(type: ApplicationCommandTypes): this {
		return (this.type = type), this;
	}

	setName(name: string): this {
		return (this.name = name), this;
	}

	setDescription(description: string): this {
		return (this.description = description), this;
	}

	setDefaultMemberPermission(perm: PermissionStrings[]): this {
		return (this.defaultMemberPermissions = perm), this;
	}

	setNameLocalizations(l: Localization): this {
		return (this.nameLocalizations = l), this;
	}

	setDescriptionLocalizations(l: Localization): this {
		return (this.descriptionLocalizations = l), this;
	}

	setDmPermission(perm: boolean): this {
		return (this.dmPermission = perm), this;
	}
}

export type MessageApplicationCommandBuilderJSON = {
	name: string;
	type: ApplicationCommandTypes.Message;
};

export class MessageApplicationCommandBuilder {
	type: ApplicationCommandTypes;
	name?: string;
	constructor(type?: ApplicationCommandTypes, name?: string) {
		this.type = type ?? ApplicationCommandTypes.Message;
		this.name = name;
	}

	setName(name: string): this {
		return (this.name = name), this;
	}

	toJSON(): MessageApplicationCommandBuilderJSON {
		if (!this.name) { throw new TypeError("Propety 'name' is required"); }

		return {
			type: ApplicationCommandTypes.Message,
			name: this.name
		};
	}
}

export class ChatInputApplicationCommandBuilder extends ApplicationCommandBuilder {
	type: ApplicationCommandTypes.ChatInput = ApplicationCommandTypes.ChatInput;

	toJSON(): CreateApplicationCommand {
		if (!this.type) { throw new TypeError("Propety 'type' is required"); }
		if (!this.name) { throw new TypeError("Propety 'name' is required"); }
		if (!this.description) {
			throw new TypeError("Propety 'description' is required");
		}

		return {
			type: ApplicationCommandTypes.ChatInput,
			name: this.name,
			description: this.description,
			options: this.options?.map(o => o.toJSON()) ?? [],
			default_member_permissions: this.defaultMemberPermissions,
			name_localizations: this.nameLocalizations,
			description_localizations: this.descriptionLocalizations,
			dm_permission: this.dmPermission
		};
	}
}

OptionBased.applyTo(ChatInputApplicationCommandBuilder);

export interface ChatInputApplicationCommandBuilder
	extends ApplicationCommandBuilder,
		OptionBased {
	// pass
}
