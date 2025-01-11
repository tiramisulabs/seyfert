import {
	type APIActionRowComponent,
	type APIApplicationCommandAutocompleteInteraction,
	type APIApplicationCommandInteraction,
	type APIBaseInteraction,
	type APIChatInputApplicationCommandInteraction,
	type APIChatInputApplicationCommandInteractionData,
	type APICommandAutocompleteInteractionResponseCallbackData,
	type APIEntryPointCommandInteraction,
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
	type InteractionCallbackData,
	type InteractionCallbackResourceActivity,
	InteractionResponseType,
	InteractionType,
	type MessageFlags,
	type RESTAPIAttachment,
	type RESTPostAPIInteractionCallbackJSONBody,
	type RESTPostAPIInteractionCallbackResult,
} from '../types';

import type { RawFile } from '../api';
import { ActionRow, Embed, Modal, PollBuilder, resolveAttachment, resolveFiles } from '../builders';
import {
	type EntitlementStructure,
	type GuildRoleStructure,
	type GuildStructure,
	type InteractionGuildMemberStructure,
	type MessageStructure,
	type OptionResolverStructure,
	Transformers,
	type UserStructure,
	type WebhookMessageStructure,
} from '../client/transformers';
import type { ContextOptionsResolved, UsingClient } from '../commands';
import {
	type ComponentInteractionMessageUpdate,
	type InteractionCreateBodyRequest,
	type InteractionMessageUpdateBodyRequest,
	type MessageCreateBodyRequest,
	type MessageUpdateBodyRequest,
	type MessageWebhookCreateBodyRequest,
	type ModalCreateBodyRequest,
	type ObjectToLower,
	type OmitInsert,
	type ToClass,
	type When,
	toCamelCase,
} from '../common';
import { mix } from '../deps/mixer';
import { type AllChannels, channelFrom } from './';
import { DiscordBase } from './extra/DiscordBase';
import { PermissionsBitField } from './extra/Permissions';

export type ReplyInteractionBody =
	| { type: InteractionResponseType.Modal; data: ModalCreateBodyRequest }
	| {
			type: InteractionResponseType.ChannelMessageWithSource | InteractionResponseType.UpdateMessage;
			data: InteractionCreateBodyRequest | InteractionMessageUpdateBodyRequest | ComponentInteractionMessageUpdate;
	  }
	| { type: InteractionResponseType.LaunchActivity }
	| Exclude<RESTPostAPIInteractionCallbackJSONBody, APIInteractionResponsePong>;

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
	replied?: Promise<boolean | RESTPostAPIInteractionCallbackResult | undefined> | boolean;
	appPermissions: PermissionsBitField;
	entitlements: EntitlementStructure[];

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
		this.appPermissions = new PermissionsBitField(Number(interaction.app_permissions));
		if ('channel' in interaction) {
			this.channel = channelFrom(interaction.channel, client);
		}
		this.user = this.member?.user ?? Transformers.User(client, interaction.user!);

		this.entitlements = interaction.entitlements.map(e => Transformers.Entitlement(this.client, e));
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
				//@ts-ignore
				return {
					type: body.type,
					data: BaseInteraction.transformBody(body.data ?? {}, files, self),
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
			case InteractionResponseType.LaunchActivity:
				return body;
			default:
				return body;
		}
	}

	static transformBody<T>(
		body:
			| InteractionCreateBodyRequest
			| InteractionMessageUpdateBodyRequest
			| MessageUpdateBodyRequest
			| MessageCreateBodyRequest
			| MessageWebhookCreateBodyRequest,
		files: RawFile[] | undefined,
		self: UsingClient,
	) {
		const poll = (body as MessageWebhookCreateBodyRequest).poll;

		const payload = {
			allowed_mentions: self.options?.allowedMentions,
			...body,
			components: body.components?.map(x => (x instanceof ActionRow ? x.toJSON() : x)),
			embeds: body?.embeds?.map(x => (x instanceof Embed ? x.toJSON() : x)),
			poll: poll ? (poll instanceof PollBuilder ? poll.toJSON() : poll) : undefined,
		};

		if ('attachments' in body) {
			payload.attachments =
				body.attachments?.map((x, i) => ({
					id: x.id ?? i.toString(),
					...resolveAttachment(x),
				})) ?? undefined;
		} else if (files?.length) {
			payload.attachments = files?.map(({ filename }, i) => ({
				id: i.toString(),
				filename,
			})) as RESTAPIAttachment[];
		}
		return payload as T;
	}

	private async matchReplied(body: ReplyInteractionBody, withResponse = false) {
		if (this.__reply) {
			//@ts-expect-error
			const { files, ...rest } = body.data ?? {};
			//@ts-expect-error
			const data = body.data instanceof Modal ? body.data : rest;
			const parsedFiles = files ? await resolveFiles(files) : undefined;
			await (this.replied = this.__reply({
				body: BaseInteraction.transformBodyRequest({ data, type: body.type }, parsedFiles, this.client),
				files: parsedFiles,
			}).then(() => (this.replied = true)));
			return;
		}
		const result = await (this.replied = this.client.interactions.reply(this.id, this.token, body, withResponse));
		this.replied = true;
		return result?.resource?.message
			? Transformers.WebhookMessage(this.client, result.resource.message as any, this.id, this.token)
			: undefined;
	}

	async reply<WR extends boolean = false>(
		body: ReplyInteractionBody,
		withResponse?: WR,
	): Promise<When<WR, WebhookMessageStructure, undefined>> {
		if (this.replied) {
			throw new Error('Interaction already replied');
		}
		const result = await this.matchReplied(body, withResponse);
		// @ts-expect-error
		if (body.data instanceof Modal) {
			// @ts-expect-error
			if (body.data.__exec) this.client.components.modals.set(this.user.id, (body.data as Modal).__exec);
			else if (this.client.components.modals.has(this.user.id)) this.client.components.modals.delete(this.user.id);
		}
		return result as never;
	}

	deferReply<WR extends boolean = false>(
		flags?: MessageFlags,
		withResponse?: WR,
	): Promise<When<WR, WebhookMessageStructure, undefined>> {
		return this.reply(
			{
				type: InteractionResponseType.DeferredChannelMessageWithSource,
				data: {
					flags,
				},
			},
			withResponse,
		) as never;
	}

	isButton(): this is ButtonInteraction {
		return false;
	}

	isChannelSelectMenu(): this is ChannelSelectMenuInteraction {
		return false;
	}

	isRoleSelectMenu(): this is RoleSelectMenuInteraction {
		return false;
	}

	isMentionableSelectMenu(): this is MentionableSelectMenuInteraction {
		return false;
	}

	isUserSelectMenu(): this is UserSelectMenuInteraction {
		return false;
	}

	isStringSelectMenu(): this is StringSelectMenuInteraction {
		return false;
	}

	isChatInput(): this is ChatInputCommandInteraction {
		return false;
	}

	isUser(): this is UserCommandInteraction {
		return false;
	}

	isMessage(): this is MessageCommandInteraction {
		return false;
	}

	isAutocomplete(): this is AutocompleteInteraction {
		return false;
	}

	isModal(): this is ModalSubmitInteraction {
		return false;
	}

	isEntryPoint(): this is EntryPointInteraction {
		return false;
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
					case ApplicationCommandType.PrimaryEntryPoint:
						return new EntryPointInteraction(client, gateway as APIEntryPointCommandInteraction, __reply);
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

	async fetchGuild(force = false): Promise<GuildStructure<'api'> | undefined> {
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
	| EntryPointInteraction
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
	declare entitlements: EntitlementStructure[];
	declare channel: AllChannels;
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

	isAutocomplete(): this is AutocompleteInteraction {
		return true;
	}

	/** @intenal */
	async reply(..._args: unknown[]): Promise<any> {
		throw new Error('Cannot use reply in this interaction');
	}
}

export class Interaction<
	FromGuild extends boolean = boolean,
	Type extends APIInteraction = APIInteraction,
> extends BaseInteraction<FromGuild, Type> {
	declare channel: AllChannels;
	fetchMessage(messageId: string): Promise<WebhookMessageStructure> {
		return this.client.interactions.fetchResponse(this.token, messageId);
	}

	fetchResponse(): Promise<WebhookMessageStructure> {
		return this.fetchMessage('@original');
	}

	write<FR extends boolean = false>(
		body: InteractionCreateBodyRequest,
		withResponse?: FR,
	): Promise<When<FR, WebhookMessageStructure, void>> {
		return this.reply(
			{
				type: InteractionResponseType.ChannelMessageWithSource,
				data: body,
			},
			withResponse,
		) as never;
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
	async editOrReply<FR extends true = true>(
		body: InteractionMessageUpdateBodyRequest,
		fetchReply?: FR,
	): Promise<WebhookMessageStructure> {
		if (await this.replied) {
			const { content, embeds, allowed_mentions, components, files, attachments, poll } = body;
			return this.editResponse({ content, embeds, allowed_mentions, components, files, attachments, poll });
		}
		return this.write(body as InteractionCreateBodyRequest, fetchReply);
	}

	editMessage(messageId: string, body: InteractionMessageUpdateBodyRequest): Promise<WebhookMessageStructure> {
		return this.client.interactions.editMessage(this.token, messageId, body);
	}

	editResponse(body: InteractionMessageUpdateBodyRequest): Promise<WebhookMessageStructure> {
		return this.editMessage('@original', body);
	}

	deleteResponse() {
		return this.deleteMessage('@original');
	}

	deleteMessage(messageId: string) {
		return this.client.interactions.deleteResponse(this.token, messageId);
	}

	followup(body: MessageWebhookCreateBodyRequest): Promise<WebhookMessageStructure> {
		return this.client.interactions.followup(this.token, body);
	}
}

export class ApplicationCommandInteraction<
	FromGuild extends boolean = boolean,
	Type extends APIApplicationCommandInteraction = APIApplicationCommandInteraction,
> extends Interaction<FromGuild, Type> {
	type!: ApplicationCommandType;
	declare channel: AllChannels;
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

/**
 * Seyfert don't support activities, so this interaction is blank
 */
export class EntryPointInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<
	FromGuild,
	APIEntryPointCommandInteraction
> {
	declare channel: AllChannels;
	async withReponse(data?: InteractionCreateBodyRequest) {
		let body = { type: InteractionResponseType.LaunchActivity } as const;

		if (data) {
			let { files, ...rest } = data;
			files = files ? await resolveFiles(files) : undefined;
			body = BaseInteraction.transformBody(rest, files, this.client);
		}
		const response = await this.client.proxy
			.interactions(this.id)(this.token)
			.callback.post({
				body,
				query: { with_response: true },
			});

		const result: Partial<EntryPointWithResponseResult> = {
			interaction: toCamelCase(response.interaction),
		};

		if (response.resource) {
			if (response.resource.type !== InteractionResponseType.LaunchActivity) {
				result.resource = {
					type: response.resource.type,
					message: Transformers.WebhookMessage(this.client, response.resource.message as any, this.id, this.token),
				};
			} else {
				result.resource = {
					type: response.resource.type,
					activityInstance: response.resource.activity_instance!,
				};
			}
		}

		return result as EntryPointWithResponseResult;
	}

	isEntryPoint(): this is EntryPointInteraction {
		return true;
	}
}

export interface EntryPointWithResponseResult {
	interaction: ObjectToLower<InteractionCallbackData>;
	resource?:
		| { type: InteractionResponseType.LaunchActivity; activityInstance: InteractionCallbackResourceActivity }
		| {
				type: Exclude<InteractionResponseType, InteractionResponseType.LaunchActivity>;
				message: WebhookMessageStructure;
		  };
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
	declare channel: AllChannels;
	declare type: InteractionType.MessageComponent;
	declare message: MessageStructure;
	declare entitlements: EntitlementStructure[];

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
}

export class ButtonInteraction extends ComponentInteraction {
	declare data: ObjectToLower<APIMessageButtonInteractionData>;

	isButton(): this is ButtonInteraction {
		return true;
	}
}

export class SelectMenuInteraction extends ComponentInteraction {
	declare data: ObjectToLower<APIMessageComponentSelectMenuInteraction['data']>;
	declare channel: AllChannels;
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
	Omit<SelectMenuInteraction, 'data' | 'isStringSelectMenu'>,
	StringSelectMenuInteraction
>) {
	declare data: OmitInsert<ObjectToLower<APIMessageStringSelectInteractionData>, 'values', { values: T }>;
	declare values: T;
	declare channel: AllChannels;
	isStringSelectMenu(): this is StringSelectMenuInteraction {
		return true;
	}
}

export class ChannelSelectMenuInteraction extends SelectMenuInteraction {
	channels: AllChannels[];
	declare channel: AllChannels;
	constructor(
		client: UsingClient,
		interaction: APIMessageComponentSelectMenuInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		const resolved = (interaction.data as APIMessageChannelSelectInteractionData).resolved;
		this.channels = this.values.map(x => channelFrom(resolved.channels[x], this.client));
	}

	isChannelSelectMenu(): this is ChannelSelectMenuInteraction {
		return true;
	}
}

export class MentionableSelectMenuInteraction extends SelectMenuInteraction {
	roles: GuildRoleStructure[];
	members: InteractionGuildMemberStructure[];
	users: UserStructure[];
	declare channel: AllChannels;
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

	isMentionableSelectMenu(): this is MentionableSelectMenuInteraction {
		return true;
	}
}

export class RoleSelectMenuInteraction extends SelectMenuInteraction {
	roles: GuildRoleStructure[];
	declare channel: AllChannels;
	constructor(
		client: UsingClient,
		interaction: APIMessageComponentSelectMenuInteraction,
		protected __reply?: __InternalReplyFunction,
	) {
		super(client, interaction);
		const resolved = (interaction.data as APIMessageRoleSelectInteractionData).resolved;
		this.roles = this.values.map(x => Transformers.GuildRole(this.client, resolved.roles[x], this.guildId!));
	}

	isRoleSelectMenu(): this is RoleSelectMenuInteraction {
		return true;
	}
}

export class UserSelectMenuInteraction extends SelectMenuInteraction {
	members: InteractionGuildMemberStructure[];
	users: UserStructure[];
	declare channel: AllChannels;
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

	isUserSelectMenu(): this is UserSelectMenuInteraction {
		return true;
	}
}

export class ChatInputCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<
	FromGuild,
	APIChatInputApplicationCommandInteraction
> {
	declare data: ObjectToLower<APIChatInputApplicationCommandInteractionData>;
	declare channel: AllChannels;
	isChatInput(): this is ChatInputCommandInteraction {
		return true;
	}
}

export class UserCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<
	FromGuild,
	APIUserApplicationCommandInteraction
> {
	declare type: ApplicationCommandType.User;
	declare data: ObjectToLower<APIUserApplicationCommandInteractionData>;
	declare channel: AllChannels;
	isUser(): this is UserCommandInteraction {
		return true;
	}
}

export class MessageCommandInteraction<FromGuild extends boolean = boolean> extends ApplicationCommandInteraction<
	FromGuild,
	APIMessageApplicationCommandInteraction
> {
	declare type: ApplicationCommandType.Message;
	declare data: ObjectToLower<APIMessageApplicationCommandInteractionData>;
	declare channel: AllChannels;
	isMessage(): this is MessageCommandInteraction {
		return true;
	}
}

export interface ModalSubmitInteraction<FromGuild extends boolean = boolean>
	extends Omit<Interaction<FromGuild, APIModalSubmitInteraction>, 'modal'> {}
@mix(Interaction)
export class ModalSubmitInteraction<FromGuild extends boolean = boolean> extends BaseInteraction<FromGuild> {
	declare data: ObjectToLower<APIModalSubmission>;
	declare channel: AllChannels;
	update<WR extends boolean = false>(
		data: ComponentInteractionMessageUpdate,
		withResponse?: WR,
	): Promise<When<WR, WebhookMessageStructure, undefined>> {
		return this.reply<WR>(
			{
				type: InteractionResponseType.UpdateMessage,
				data,
			},
			withResponse,
		);
	}

	deferUpdate<WR extends boolean = false>(withResponse?: WR): Promise<When<WR, WebhookMessageStructure, undefined>> {
		return this.reply<WR>(
			{
				type: InteractionResponseType.DeferredMessageUpdate,
			},
			withResponse,
		);
	}

	get customId() {
		return this.data.customId;
	}

	get components() {
		return this.data.components;
	}

	getInputValue(customId: string, required: true): string;
	getInputValue(customId: string, required?: false): string | undefined;
	getInputValue(customId: string, required?: boolean): string | undefined {
		let value: string | undefined;
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

	isModal(): this is ModalSubmitInteraction {
		return true;
	}
}
