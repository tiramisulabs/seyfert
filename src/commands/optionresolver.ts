import {
	type APIApplicationCommandInteractionDataOption,
	type APIAttachment,
	type APIGuildMember,
	type APIInteractionDataResolvedChannel,
	type APIInteractionGuildMember,
	type APIRole,
	type APIUser,
	ApplicationCommandOptionType,
} from 'discord-api-types/v10';
import { Attachment } from '..';
import type { MakeRequired } from '../common';
import type { AllChannels } from '../structures';
import channelFrom from '../structures/channels';
import type { Command, CommandAutocompleteOption, CommandOption, SubCommand } from './applications/chat';
import type { UsingClient } from './applications/shared';
import {
	type GuildMemberStructure,
	type GuildRoleStructure,
	type InteractionGuildMemberStructure,
	Transformers,
	type UserStructure,
} from '../client/transformers';

export type ContextOptionsResolved = {
	members?: Record<string, APIGuildMember | Omit<APIGuildMember, 'user'> | APIInteractionGuildMember>;
	users?: Record<string, APIUser>;
	roles?: Record<string, APIRole>;
	channels?: Record<string, APIInteractionDataResolvedChannel>;
	attachments?: Record<string, APIAttachment>;
};

export class OptionResolver {
	readonly options: OptionResolved[];
	public hoistedOptions: OptionResolved[];
	private subCommand: string | null = null;
	private group: string | null = null;
	constructor(
		private client: UsingClient,
		options: APIApplicationCommandInteractionDataOption[],
		public parent?: Command,
		public guildId?: string,
		public resolved?: ContextOptionsResolved,
	) {
		this.hoistedOptions = this.options = options.map(option => this.transformOption(option, resolved));

		if (this.hoistedOptions[0]?.type === ApplicationCommandOptionType.Subcommand) {
			this.subCommand = this.hoistedOptions[0].name;
			this.hoistedOptions = this.hoistedOptions[0].options ?? [];
		}
		if (this.hoistedOptions[0]?.type === ApplicationCommandOptionType.SubcommandGroup) {
			this.group = this.hoistedOptions[0].name;
			this.subCommand = this.hoistedOptions[0].options![0]!.name;
			this.hoistedOptions = this.hoistedOptions[0].options![0].options ?? [];
		}
	}

	get fullCommandName() {
		return `${this.parent?.name}${
			this.group ? ` ${this.group} ${this.subCommand}` : this.subCommand ? ` ${this.subCommand}` : ''
		}`;
	}

	getCommand() {
		if (this.subCommand) {
			return (this.parent?.options as SubCommand[] | undefined)?.find(
				x => (this.group ? x.group === this.group : true) && x.name === this.subCommand,
			);
		}
		return this.parent;
	}

	getAutocompleteValue(): string | undefined {
		return this.hoistedOptions.find(option => option.focused)?.value as string;
	}

	getAutocomplete() {
		return (this.getCommand()?.options as CommandOption[]).find(
			option => option.name === this.hoistedOptions.find(x => x.focused)?.name,
		) as CommandAutocompleteOption | undefined;
	}

	getParent() {
		return this.parent?.name;
	}

	getSubCommand() {
		return this.subCommand;
	}

	getGroup() {
		return this.group;
	}

	get(name: string) {
		return this.options.find(opt => opt.name === name);
	}

	getHoisted(name: string) {
		return this.hoistedOptions.find(x => x.name === name);
	}

	getValue(name: string) {
		const option = this.getHoisted(name);
		if (!option) {
			return;
		}

		switch (option.type) {
			case ApplicationCommandOptionType.Attachment:
				return option.attachment!;
			case ApplicationCommandOptionType.Boolean:
				return option.value as boolean;
			case ApplicationCommandOptionType.Channel:
				return option.channel!;
			case ApplicationCommandOptionType.Integer:
			case ApplicationCommandOptionType.Number:
				return option.value as number;
			case ApplicationCommandOptionType.Role:
				return option.role;
			case ApplicationCommandOptionType.String:
				return option.value as string;
			case ApplicationCommandOptionType.User:
				return option.member ?? option.user;
			case ApplicationCommandOptionType.Mentionable:
				return option.member ?? option.user ?? option.role;
			default:
				return;
		}
	}

	private getTypedOption(name: string, allow: ApplicationCommandOptionType[]) {
		const option = this.getHoisted(name);
		if (!option) {
			throw new Error('Bad Option');
		}
		if (!allow.includes(option.type)) {
			throw new Error('Bad Option');
		}
		return option;
	}

	getChannel(name: string, required?: true): AllChannels;
	getChannel(name: string): AllChannels | undefined {
		const option = this.getTypedOption(name, [ApplicationCommandOptionType.Channel]);
		return option.channel;
	}

	getString(name: string, required?: true): string;
	getString(name: string): string | null {
		const option = this.getTypedOption(name, [ApplicationCommandOptionType.String]);
		return option.value as string;
	}

	transformOption(option: APIApplicationCommandInteractionDataOption, resolved?: ContextOptionsResolved) {
		const resolve: OptionResolved = {
			...option,
		};

		if ('value' in option) {
			resolve.value = option.value;
		}
		if ('options' in option) {
			resolve.options = option.options?.map(x => this.transformOption(x, resolved));
		}
		if (resolved) {
			const value = resolve.value as string;
			const user = resolved.users?.[value];
			if (user) {
				resolve.user = Transformers.User(this.client, user);
			}

			const member = resolved.members?.[value];

			if (member) {
				resolve.member =
					'permissions' in member
						? Transformers.InteractionGuildMember(this.client, member, user!, this.guildId!)
						: Transformers.GuildMember(this.client, member, user!, this.guildId!);
			}

			const channel = resolved.channels?.[value];
			if (channel) {
				resolve.channel = 'fetch' in channel ? (channel as unknown as AllChannels) : channelFrom(channel, this.client);
			}

			const role = resolved.roles?.[value];
			if (role) {
				resolve.role = Transformers.GuildRole(this.client, role, this.guildId!);
			}

			const attachment = resolved.attachments?.[value];
			if (attachment) {
				resolve.attachment = attachment instanceof Attachment ? attachment : new Attachment(this.client, attachment);
			}
		}

		return resolve;
	}
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
	type:
		| ApplicationCommandOptionType.Boolean
		| ApplicationCommandOptionType.Integer
		| ApplicationCommandOptionType.Number
		| ApplicationCommandOptionType.String;
};

export type OptionResolvedWithProp = Exclude<
	OptionResolved,
	{
		type:
			| ApplicationCommandOptionType.Boolean
			| ApplicationCommandOptionType.Integer
			| ApplicationCommandOptionType.Number
			| ApplicationCommandOptionType.String;
	}
>;
