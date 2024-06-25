import {
	type APIActionRowComponent,
	type APIApplicationCommandAutocompleteInteraction,
	type APIApplicationCommandInteraction,
	type APIBaseInteraction,
	type APIChatInputApplicationCommandInteraction,
	type APIChatInputApplicationCommandInteractionData,
	type APICommandAutocompleteInteractionResponseCallbackData,
	type APIInteraction,
	type APIInteractionResponse,
	type APIInteractionResponseChannelMessageWithSource,
	type APIInteractionResponseDeferredChannelMessageWithSource,
	type APIInteractionResponseDeferredMessageUpdate,
	type APIInteractionResponsePong,
	type APIInteractionResponseUpdateMessage,
	type APIMessageApplicationCommandInteraction,
	type APIMessageApplicationCommandInteractionData,
	type APIMessageButtonInteractionData,
	type APIMessageChannelSelectInteractionData,
	type APIMessageComponentInteraction,
	type APIMessageComponentSelectMenuInteraction,
	type APIMessageMentionableSelectInteractionData,
	type APIMessageRoleSelectInteractionData,
	type APIMessageStringSelectInteractionData,
	type APIMessageUserSelectInteractionData,
	type APIModalSubmission,
	type APIModalSubmitInteraction,
	type APITextInputComponent,
	type APIUserApplicationCommandInteraction,
	type APIUserApplicationCommandInteractionData,
	ApplicationCommandType,
	ComponentType,
	type GatewayInteractionCreateDispatchData,
	InteractionResponseType,
	InteractionType,
	type MessageFlags,
	type RESTPostAPIInteractionCallbackJSONBody,
	type RESTAPIAttachment,
} from 'discord-api-types/v10';
import { mix } from 'ts-mixer';
import type { RawFile } from '../api';
import { ActionRow, Embed, Modal, PollBuilder, resolveAttachment, resolveFiles } from '../builders';
import type { ContextOptionsResolved, UsingClient } from '../commands';
import type { ObjectToLower, OmitInsert, ToClass, When } from '../common';
import type {
	ComponentInteractionMessageUpdate,
	InteractionCreateBodyRequest,
	InteractionMessageUpdateBodyRequest,
	MessageCreateBodyRequest,
	MessageUpdateBodyRequest,
	MessageWebhookCreateBodyRequest,
	ModalCreateBodyRequest,
} from '../common/types/write';
import type { AllChannels } from './';
import channelFrom from './channels';
import { DiscordBase } from './extra/DiscordBase';
import { PermissionsBitField } from './extra/Permissions';
import {
	type GuildRoleStructure,
	type InteractionGuildMemberStructure,
	type MessageStructure,
	Transformers,
	type UserStructure,
	type WebhookMessageStructure,
	type OptionResolverStructure,
} from '../client/transformers';

export type ReplyInteractionBody =
	| { type: InteractionResponseType.Modal; data: ModalCreateBodyRequest }
	| {
			type: InteractionResponseType.ChannelMessageWithSource | InteractionResponseType.UpdateMessage;
			data: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest | ComponentInteractionMessageUpdate;
	  }
	| Exclude<RESTPostAPIInteractionCallbackJSONBody, APIInteractionResponsePong>;

/** @internal */
export type __InternalReplyFunction = (_: { body: APIInteractionResponse; files?: RawFile[] }) => Promise<any>;

export interface BaseInteraction
	extends ObjectToLower<
		Omit<
			APIBaseInteraction<InteractionType, any>,
			'user' | 'member' | 'message' | 'channel' | 'type' | 'app_permissions'
		>
	> {}

export class BaseInteraction<
	FromGuild extends boolean = boolean,
	Type extends APIInteraction = APIInteraction,
> extends DiscordBase<Type> {
	user: UserStructure;
	member!: When<FromGuild, InteractionGuildMemberStructure, undefined>;
	channel?: AllChannels;
	message?: MessageStructure;
	replied?: Promise<boolean> | boolean;
	appPermissions?: PermissionsBitField;

	constructor(
		readonly client: UsingClient,
		interaction: Type,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		if (interaction.member) {
			this.member = Transformers.InteractionGuildMember(
				client,
				interaction.member,
				interaction.member.user,
				interaction.guild_id!,
			) as never;
		}
		if (interaction.message) {
			this.message = Transformers.Message(client, interaction.message);
		}
		if (interaction.app_permissions) {
			this.appPermissions = new PermissionsBitField(Number(interaction.app_permissions));
		}
		if (interaction.channel) {
			this.channel = channelFrom(interaction.channel, client);
		}
		this.user = this.member?.user ?? Transformers.User(client, interaction.user!);
	}

	static transformBodyRequest(
		body: ReplyInteractionBody,
		files: RawFile[] | undefined,
		self: UsingClient,
	): APIInteractionResponse {
		switch (body.type) {
			case InteractionResponseType.ApplicationCommandAutocompleteResult:
			case InteractionResponseType.DeferredMessageUpdate:
			case InteractionResponseType.DeferredChannelMessageWithSource:
				return body;
			case InteractionResponseType.ChannelMessageWithSource:
			case InteractionResponseType.UpdateMessage: {
				return {
					type: body.type,
					//@ts-ignore
					data: BaseInteraction.transformBodyRequest(body.data ?? {}, files, self),
				};
			}
			case InteractionResponseType.Modal:
				return {
					type: body.type,
					data:
						body.data instanceof Modal
							? body.data.toJSON()
							: {
									...body.data,
									components: body.data?.components
										? body.data.components.map(x =>
												x instanceof ActionRow
													? (x.toJSON() as unknown as APIActionRowComponent<APITextInputComponent>)
													: x,
											)
										: [],
								},
				};
			default:
				return body;
		}
	}

	static transformBody<T>(
		body:
			| InteractionMessageUpdateBodyRequest
			| MessageUpdateBodyRequest
			| MessageCreateBodyRequest
			| MessageWebhookCreateBodyRequest,
		files: RawFile[] | undefined,
		self: UsingClient,
	) {
		const poll = (body as MessageWebhookCreateBodyRequest).poll;

		const allow = {
			allowed_mentions: self.options?.allowedMentions,

			...body,
			components: body.components?.map(x => (x instanceof ActionRow ? x.toJSON() : x)),
			embeds: body?.embeds?.map(x => (x instanceof Embed ? x.toJSON() : x)),
			poll: poll ? (poll instanceof PollBuilder ? poll.toJSON() : poll) : undefined,
		};

		if ('attachment' in body) {
			allow.attachments =
				body.attachments?.map((x, i) => ({
					id: i,
					...resolveAttachment(x),
				})) ?? undefined;
		} else if (files?.length) {
			allow.attachments = files?.map((x, id) => ({
				id,
				filename: x.name,
			})) as RESTAPIAttachment[];
		}
		return allow as unknown as T;
	}

	private async matchReplied(body: ReplyInteractionBody) {
		if (this.__reply) {
			//@ts-expect-error
			const { files, ...rest } = body.data ?? {};
			//@ts-expect-error
			const data = body.data instanceof Modal ? body.data : rest;
			const parsedFiles = files ? await resolveFiles(files) : undefined;
			return (this.replied = this.__reply({
				body: BaseInteraction.transformBodyRequest({ data, type: body.type }, parsedFiles, this.client),
				files: parsedFiles,
			}).then(() => (this.replied = true)));
		}
		return (this.replied = this.client.interactions.reply(this.id, this.token, body).then(() => (this.replied = true)));
	}

	async reply(body: ReplyInteractionBody) {
		if (this.replied) {
			throw new Error('Interaction already replied');
		}
		await this.matchReplied(body);
		// @ts-expect-error
		if (body.data instanceof Modal && body.data.__exec)
			// @ts-expect-error
			this.client.components.modals.set(this.user.id, (body.data as Modal).__exec);
	}

	deferReply(flags?: MessageFlags) {
		return this.reply({
			type: InteractionResponseType.DeferredChannelMessageWithSource,
			data: {
				flags,
			},
		});
	}

	static from(client: UsingClient, gateway: GatewayInteractionCreateDispatchData, __reply?: __InternalReplyFunction) {
		switch (gateway.type) {
			case InteractionType.ApplicationCommandAutocomplete:
				return new AutocompleteInteraction(client, gateway, undefined, __reply);
			// biome-ignore lint/suspicious/noFallthroughSwitchClause: bad interaction  between biome and ts-server
			case InteractionType.ApplicationCommand:
				switch (gateway.data.type) {
					case ApplicationCommandType.ChatInput:
						return new ChatInputCommandInteraction(
							client,
							gateway as APIChatInputApplicationCommandInteraction,
							__reply,
						);
					case ApplicationCommandType.User:
						return new UserCommandInteraction(client, gateway as APIUserApplicationCommandInteraction, __reply);
					case ApplicationCommandType.Message:
						return new MessageCommandInteraction(client, gateway as APIMessageApplicationCommandInteraction, __reply);
				}
			// biome-ignore lint/suspicious/noFallthroughSwitchClause: bad interaction  between biome and ts-server
			case InteractionType.MessageComponent:
				switch (gateway.data.component_type) {
					case ComponentType.Button:
						return new ButtonInteraction(client, gateway as APIMessageComponentInteraction, __reply);
					case ComponentType.ChannelSelect:
						return new ChannelSelectMenuInteraction(
							client,
							gateway as APIMessageComponentSelectMenuInteraction,
							__reply,
						);
					case ComponentType.RoleSelect:
						return new RoleSelectMenuInteraction(client, gateway as APIMessageComponentSelectMenuInteraction, __reply);
					case ComponentType.MentionableSelect:
						return new MentionableSelectMenuInteraction(
							client,
							gateway as APIMessageComponentSelectMenuInteraction,
							__reply,
						);
					case ComponentType.UserSelect:
						return new UserSelectMenuInteraction(client, gateway as APIMessageComponentSelectMenuInteraction, __reply);
					case ComponentType.StringSelect:
						return new StringSelectMenuInteraction(
							client,
							gateway as APIMessageComponentSelectMenuInteraction,
							__reply,
						);
				}
			case InteractionType.ModalSubmit:
				return new ModalSubmitInteraction(client, gateway);
			default:
				return new BaseInteraction(client, gateway);
		}
	}

	fetchGuild(force = false) {
		return this.guildId ? this.client.guilds.fetch(this.guildId, force) : undefined;
	}
}

export type AllInteractions =
	| AutocompleteInteraction
	| ChatInputCommandInteraction
	| UserCommandInteraction
	| MessageCommandInteraction
	| ComponentInteraction
	| SelectMenuInteraction
	| ModalSubmitInteraction
	| BaseInteraction;

export interface AutocompleteInteraction
	extends ObjectToLower<
		Omit<
			APIApplicationCommandAutocompleteInteraction,
			'user' | 'member' | 'type' | 'data' | 'message' | 'channel' | 'app_permissions'
		>
	> {}

export class AutocompleteInteraction<FromGuild extends boolean = boolean> extends BaseInteraction<
	FromGuild,
	APIApplicationCommandAutocompleteInteraction
> {
	declare type: InteractionType.ApplicationCommandAutocomplete;
	declare data: ObjectToLower<APIApplicationCommandAutocompleteInteraction['data']>;
	options: OptionResolverStructure;
	constructor(
		client: UsingClient,
		interaction: APIApplicationCommandAutocompleteInteraction,
		resolver?: OptionResolverStructure,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		this.options =
			resolver ??
			Transformers.OptionResolver(
				client,
				interaction.data.options,
				undefined,
				interaction.guild_id,
				interaction.data.resolved as ContextOptionsResolved,
			);
	}

	getInput() {
		return this.options.getAutocompleteValue() ?? '';
	}

	respond(choices: APICommandAutocompleteInteractionResponseCallbackData['choices']) {
		return super.reply({ data: { choices }, type: InteractionResponseType.ApplicationCommandAutocompleteResult });
	}

	/** @intenal */
	async reply(..._args: unknown[]) {
		throw new Error('Cannot use reply in this interaction');
	}
}

export class Interaction<
	FromGuild extends boolean = boolean,
	Type extends APIInteraction = APIInteraction,
> extends BaseInteraction<FromGuild, Type> {
	fetchMessage(messageId: string) {
		return this.client.interactions.fetchResponse(this.token, messageId);
	}

	fetchResponse() {
		return this.fetchMessage('@original');
	}

	async write<FR extends boolean = false>(
		body: InteractionCreateBodyRequest,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure, void>> {
		(await this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: body,
		})) as never;
		if (fetchReply) return this.fetchResponse() as never;
		return undefined as never;
	}

	modal(body: ModalCreateBodyRequest) {
		return this.reply({
			type: InteractionResponseType.Modal,
			data: body,
		});
	}

	async editOrReply<FR extends boolean = false>(
		body: InteractionCreateBodyRequest,
		fetchReply?: FR,
	): Promise<When<FR, WebhookMessageStructure, void>>;
	async editOrReply<FR extends true = true>(body: InteractionMessageUpdateBodyRequest, fetchReply?: FR) {
		if (await this.replied) {
			const { content, embeds, allowed_mentions, components, files, attachments } = body;
			return this.editResponse({ content, embeds, allowed_mentions, components, files, attachments });
		}
		return this.write(body as InteractionCreateBodyRequest, fetchReply);
	}

	editMessage(messageId: string, body: InteractionMessageUpdateBodyRequest) {
		return this.client.interactions.editMessage(this.token, messageId, body);
	}

	editResponse(body: InteractionMessageUpdateBodyRequest) {
		return this.editMessage('@original', body);
	}

	deleteResponse() {
		return this.deleteMessage('@original');
	}

	deleteMessage(messageId: string) {
		return this.client.interactions.deleteResponse(this.id, this.token, messageId);
	}

	async followup(body: MessageWebhookCreateBodyRequest) {
		return this.client.interactions.followup(this.token, body);
	}
}

export class ApplicationCommandInteraction<
	FromGuild extends boolean = boolean,
	Type extends APIApplicationCommandInteraction = APIApplicationCommandInteraction,
> extends Interaction<FromGuild, Type> {
	type = ApplicationCommandType.ChatInput;
	respond(
		data:
			| APIInteractionResponseChannelMessageWithSource
			| APIInteractionResponseDeferredChannelMessageWithSource
			| APIInteractionResponseDeferredMessageUpdate
			| APIInteractionResponseUpdateMessage,
	) {
		return this.reply(data);
	}
}

export interface ComponentInteraction
	extends ObjectToLower<
		Omit<
			APIMessageComponentInteraction,
			'user' | 'member' | 'type' | 'data' | 'message' | 'channel' | 'app_permissions'
		>
	> {}

export class ComponentInteraction<
	FromGuild extends boolean = boolean,
	Type extends APIMessageComponentInteraction = APIMessageComponentInteraction,
> extends Interaction<FromGuild, Type> {
	declare data: ObjectToLower<APIMessageComponentInteraction['data']>;
	declare channelId: string;
	declare channel: AllChannels;
	declare type: InteractionType.MessageComponent;
	declare message: MessageStructure;

	update(data: ComponentInteractionMessageUpdate) {
		return this.reply({
			type: InteractionResponseType.UpdateMessage,
			data,
		});
	}

	deferUpdate() {
		return this.reply({
			type: InteractionResponseType.DeferredMessageUpdate,
		});
	}

	get customId() {
		return this.data.customId;
	}

	get componentType() {
		return this.data.componentType;
	}

	isButton(): this is ButtonInteraction {
		return this.data.componentType === ComponentType.Button;
	}

	isChannelSelectMenu(): this is ChannelSelectMenuInteraction {
		return this.componentType === ComponentType.ChannelSelect;
	}

	isRoleSelectMenu(): this is RoleSelectMenuInteraction {
		return this.componentType === ComponentType.RoleSelect;
	}

	isMentionableSelectMenu(): this is MentionableSelectMenuInteraction {
		return this.componentType === ComponentType.MentionableSelect;
	}

	isUserSelectMenu(): this is UserSelectMenuInteraction {
		return this.componentType === ComponentType.UserSelect;
	}

	isStringSelectMenu(): this is StringSelectMenuInteraction {
		return this.componentType === ComponentType.StringSelect;
	}
}

export class ButtonInteraction extends ComponentInteraction {
	declare data: ObjectToLower<APIMessageButtonInteractionData>;
}

export class SelectMenuInteraction extends ComponentInteraction {
	declare data: ObjectToLower<APIMessageComponentSelectMenuInteraction['data']>;

	constructor(
		client: UsingClient,
		interaction: APIMessageComponentSelectMenuInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
	}

	get values() {
		return this.data.values;
	}
}

export class StringSelectMenuInteraction<
	T extends any[] = string[],
> extends (SelectMenuInteraction as unknown as ToClass<
	Omit<SelectMenuInteraction, 'data'>,
	StringSelectMenuInteraction
>) {
	declare data: OmitInsert<ObjectToLower<APIMessageStringSelectInteractionData>, 'values', { values: T }>;
	declare values: T;
}

export class ChannelSelectMenuInteraction extends SelectMenuInteraction {
	channels: AllChannels[];
	constructor(
		client: UsingClient,
		interaction: APIMessageComponentSelectMenuInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		const resolved = (interaction.data as APIMessageChannelSelectInteractionData).resolved;
		this.channels = this.values.map(x => channelFrom(resolved.channels[x], this.client));
	}
}

export class MentionableSelectMenuInteraction extends SelectMenuInteraction {
	roles: GuildRoleStructure[];
	members: InteractionGuildMemberStructure[];
	users: UserStructure[];
	constructor(
		client: UsingClient,
		interaction: APIMessageComponentSelectMenuInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		const resolved = (interaction.data as APIMessageMentionableSelectInteractionData).resolved;
		this.roles = resolved.roles
			? this.values.map(x => Transformers.GuildRole(this.client, resolved.roles![x], this.guildId!))
			: [];
		this.members = resolved.members
			? this.values.map(x =>
					Transformers.InteractionGuildMember(
						this.client,
						resolved.members![x],
						resolved.users![this.values!.find(u => u === x)!]!,
						this.guildId!,
					),
				)
			: [];
		this.users = resolved.users ? this.values.map(x => Transformers.User(this.client, resolved.users![x])) : [];
	}
}

export class RoleSelectMenuInteraction extends SelectMenuInteraction {
	roles: GuildRoleStructure[];
	constructor(
		client: UsingClient,
		interaction: APIMessageComponentSelectMenuInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		const resolved = (interaction.data as APIMessageRoleSelectInteractionData).resolved;
		this.roles = this.values.map(x => Transformers.GuildRole(this.client, resolved.roles[x], this.guildId!));
	}
}

export class UserSelectMenuInteraction extends SelectMenuInteraction {
	members: InteractionGuildMemberStructure[];
	users: UserStructure[];
	constructor(
		client: UsingClient,
		interaction: APIMessageComponentSelectMenuInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		const resolved = (interaction.data as APIMessageUserSelectInteractionData).resolved;
		this.users = this.values.map(x => Transformers.User(this.client, resolved.users[x]));
		this.members = resolved.members
			? this.values.map(x =>
					Transformers.InteractionGuildMember(
						this.client,
						resolved.members![x],
						resolved.users[this.values!.find(u => u === x)!]!,
						this.guildId!,
					),
				)
			: [];
	}
}

export class ChatInputCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<
	FromGuild,
	APIChatInputApplicationCommandInteraction
> {
	declare data: ObjectToLower<APIChatInputApplicationCommandInteractionData>;
}

export class UserCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<
	FromGuild,
	APIUserApplicationCommandInteraction
> {
	declare type: ApplicationCommandType.User;
	declare data: ObjectToLower<APIUserApplicationCommandInteractionData>;
}

export class MessageCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<
	FromGuild,
	APIMessageApplicationCommandInteraction
> {
	declare type: ApplicationCommandType.Message;
	declare data: ObjectToLower<APIMessageApplicationCommandInteractionData>;
}

export interface ModalSubmitInteraction<FromGuild extends boolean = boolean>
	extends Omit<Interaction<FromGuild, APIModalSubmitInteraction>, 'modal'> {}
@mix(Interaction)
export class ModalSubmitInteraction<FromGuild extends boolean = boolean> extends BaseInteraction<FromGuild> {
	declare data: ObjectToLower<APIModalSubmission>;
	get customId() {
		return this.data.customId;
	}

	get components() {
		return this.data.components;
	}

	getInputValue(customId: string, required: true): string;
	getInputValue(customId: string, required?: false): string | undefined;
	getInputValue(customId: string, required?: boolean): string | undefined {
		let value;
		for (const { components } of this.components) {
			const get = components.find(x => x.customId === customId);
			if (get) {
				value = get.value;
				break;
			}
		}
		if (!value && required) throw new Error(`${customId} component doesn't have a value`);
		return value;
	}
}
