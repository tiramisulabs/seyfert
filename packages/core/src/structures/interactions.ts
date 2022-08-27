import type { Model } from './base';
import type { Session } from '../biscuit';
import type {
	ApplicationCommandTypes,
	DiscordInteraction,
	DiscordMessage,
	DiscordMessageComponents,
	DiscordMemberWithUser,
	DiscordMessageInteraction,
} from '@biscuitland/api-types';
import type { CreateMessage } from './message';
import type { MessageFlags } from '../utils/util';
import type { EditWebhookMessage } from './webhook';
import {
	InteractionResponseTypes,
	InteractionTypes,
	MessageComponentTypes,
} from '@biscuitland/api-types';
import { Role } from './role';
import { Attachment } from './attachment';
import { Snowflake } from '../snowflakes';
import { User } from './user';
import { Member } from './members';
import { Message } from './message';
import { Permissions } from './special/permissions';
import { Webhook } from './webhook';
import { InteractionOptions } from './special/interaction-options';
import {
	INTERACTION_ID_TOKEN,
    WEBHOOK_MESSAGE,
	WEBHOOK_MESSAGE_ORIGINAL,
} from '@biscuitland/api-types';

export type InteractionResponseWith = {
	with: InteractionApplicationCommandCallbackData;
};
export type InteractionResponseWithData =
	| InteractionResponse
	| InteractionResponseWith;

/**
 * @link https://discord.com/developers/docs/interactions/slash-commands#interaction-response
 */
export interface InteractionResponse {
	type: InteractionResponseTypes;
	data?: InteractionApplicationCommandCallbackData;
}

/**
 * @link https://discord.com/developers/docs/interactions/slash-commands#interaction-response-interactionapplicationcommandcallbackdata
 */
export interface InteractionApplicationCommandCallbackData
	extends Pick<
		CreateMessage,
		'allowedMentions' | 'content' | 'embeds' | 'files'
	> {
	customId?: string;
	title?: string;
	components?: DiscordMessageComponents;
	flags?: MessageFlags;
	choices?: ApplicationCommandOptionChoice[];
}

/**
 * @link https://discord.com/developers/docs/interactions/slash-commands#applicationcommandoptionchoice
 */
export interface ApplicationCommandOptionChoice {
	name: string;
	value: string | number;
}

export abstract class BaseInteraction implements Model {
	constructor(session: Session, data: DiscordInteraction) {
		this.session = session;
		this.id = data.id;
		this.token = data.token;
		this.type = data.type;
		this.guildId = data.guild_id;
		this.channelId = data.channel_id;
		this.applicationId = data.application_id;
		this.version = data.version;
        this.locale = data.locale;

		const perms = data.app_permissions;

		if (perms) {
			this.appPermissions = new Permissions(BigInt(perms));
		}

		if (!data.guild_id) {
			this.user = new User(session, data.user!);
		} else {
			this.member = new Member(session, data.member!, data.guild_id);

            // dangerous black magic be careful!
            Object.defineProperty(this, 'user', {
                get() {
                    return this.member.user;
                }
            });
		}
	}

	readonly session: Session;
	readonly id: Snowflake;
	readonly token: string;

	type: InteractionTypes;
	guildId?: Snowflake;
	channelId?: Snowflake;
	applicationId?: Snowflake;
	user!: User;
	member?: Member;
	appPermissions?: Permissions;

    /**
     * @virtual
     */
    locale?: string;

	readonly version: 1;

	responded = false;

	get createdTimestamp(): number {
		return Snowflake.snowflakeToTimestamp(this.id);
	}

	get createdAt(): Date {
		return new Date(this.createdTimestamp);
	}

	isCommand(): this is CommandInteraction {
		return this.type === InteractionTypes.ApplicationCommand;
	}

	isAutoComplete(): this is AutoCompleteInteraction {
		return this.type === InteractionTypes.ApplicationCommandAutocomplete;
	}

	isComponent(): this is ComponentInteraction {
		return this.type === InteractionTypes.MessageComponent;
	}

	isPing(): this is PingInteraction {
		return this.type === InteractionTypes.Ping;
	}

	isModalSubmit(): this is ModalSubmitInteraction {
		return this.type === InteractionTypes.ModalSubmit;
	}

	inGuild(): this is this & { guildId: Snowflake } {
		return !!this.guildId;
	}

	// webhooks methods:

	async editReply(
		options: EditWebhookMessage & { messageId?: Snowflake }
	): Promise<Message | undefined> {
		const message = await this.session.rest.patch<
			DiscordMessage | undefined
		>(
			options.messageId
				? WEBHOOK_MESSAGE(this.id, this.token, options.messageId)
				: WEBHOOK_MESSAGE_ORIGINAL(this.id, this.token),
			{
				content: options.content,
				embeds: options.embeds,
				file: options.files,
				components: options.components,
				allowed_mentions: options.allowedMentions && {
					parse: options.allowedMentions.parse,
					replied_user: options.allowedMentions.repliedUser,
					users: options.allowedMentions.users,
					roles: options.allowedMentions.roles,
				},
				attachments: options.attachments?.map(attachment => {
					return {
						id: attachment.id,
						filename: attachment.name,
						content_type: attachment.contentType,
						size: attachment.size,
						url: attachment.attachment,
						proxy_url: attachment.proxyUrl,
						height: attachment.height,
						width: attachment.width,
					};
				}),
				message_id: options.messageId,
			}
		);

		if (!message || !options.messageId) {
			return message as undefined;
		}

		return new Message(this.session, message);
	}

	async sendFollowUp(
		options: InteractionApplicationCommandCallbackData
	): Promise<Message> {
		const message = await Webhook.prototype.execute.call(
			{
				id: this.applicationId!,
				token: this.token,
				session: this.session,
			},
			options
		);

		return message!;
	}

	async editFollowUp(
		messageId: Snowflake,
		options?: { threadId: Snowflake }
	): Promise<Message> {
		const message = await Webhook.prototype.editMessage.call(
			{
				id: this.session.applicationId,
				token: this.token,
			},
			messageId,
			options
		);

		return message;
	}

	async deleteFollowUp(
		messageId: Snowflake,
		threadId?: Snowflake
	): Promise<void> {
		await Webhook.prototype.deleteMessage.call(
			{
				id: this.session.applicationId,
				token: this.token,
			},
			messageId,
			threadId
		);
	}

	async fetchFollowUp(
		messageId: Snowflake,
		threadId?: Snowflake
	): Promise<Message | undefined> {
		const message = await Webhook.prototype.fetchMessage.call(
			{
				id: this.session.applicationId,
				token: this.token,
			},
			messageId,
			threadId
		);

		return message;
	}

	// end webhook methods

	async respond(resp: InteractionResponse): Promise<Message | undefined>;
	async respond(resp: InteractionResponseWith): Promise<Message | undefined>;
	async respond(
		resp: InteractionResponseWithData
	): Promise<Message | undefined> {
		const options = 'with' in resp ? resp.with : resp.data;
		const type =
			'type' in resp
				? resp.type
				: InteractionResponseTypes.ChannelMessageWithSource;

		const data = {
			content: options?.content,
			custom_id: options?.customId,
			file: options?.files,
			allowed_mentions: options?.allowedMentions,
			flags: options?.flags,
			chocies: options?.choices,
			embeds: options?.embeds,
			title: options?.title,
			components: options?.components,
		};

		if (!this.responded) {
			await this.session.rest.post<undefined>(
				INTERACTION_ID_TOKEN(this.id, this.token),
				{
                    file: options?.files,
					type,
                    data,
				}
			);

			this.responded = true;
			return;
		}

		return this.sendFollowUp(data);
	}

	// start custom methods

	async respondWith(
		resp: InteractionApplicationCommandCallbackData
	): Promise<Message | undefined> {
		const m = await this.respond({ with: resp });

		return m;
	}

	async defer() {
		await this.respond({
			type: InteractionResponseTypes.DeferredChannelMessageWithSource,
		});
	}

	async autocomplete() {
		await this.respond({
			type: InteractionResponseTypes.ApplicationCommandAutocompleteResult,
		});
	}

	// end custom methods
}

export class AutoCompleteInteraction extends BaseInteraction implements Model {
	constructor(session: Session, data: DiscordInteraction) {
		super(session, data);
		this.type = data.type as number;
		this.commandId = data.data!.id;
		this.commandName = data.data!.name;
		this.commandType = data.data!.type;
		this.commandGuildId = data.data!.guild_id;
        this.locale = super.locale!;
		this.options = new InteractionOptions(
			data.data!.options ?? []
		);
	}

	override type: InteractionTypes.ApplicationCommandAutocomplete;
	commandId: Snowflake;
	commandName: string;
	commandType: ApplicationCommandTypes;
	commandGuildId?: Snowflake;
    override locale: string;
    options: InteractionOptions;

	async respondWithChoices(
		choices: ApplicationCommandOptionChoice[]
	): Promise<void> {
		await this.session.rest.post<undefined>(
			INTERACTION_ID_TOKEN(this.id, this.token),
			{
				data: { choices },
				type: InteractionResponseTypes.ApplicationCommandAutocompleteResult,
			}
		);
	}
}

export interface CommandInteractionDataResolved {
	users: Map<Snowflake, User>;
	members: Map<Snowflake, Member>;
	roles: Map<Snowflake, Role>;
	messages: Map<Snowflake, Message>;
    attachments: Map<Snowflake, Attachment>;
}

export class CommandInteraction extends BaseInteraction implements Model {
	constructor(session: Session, data: DiscordInteraction) {
		super(session, data);
		this.type = data.type as number;
		this.commandId = data.data!.id;
		this.commandName = data.data!.name;
		this.commandType = data.data!.type;
		this.commandGuildId = data.data!.guild_id;
		this.options = new InteractionOptions(
			data.data!.options ?? []
		);

		this.resolved = {
			users: new Map(),
			members: new Map(),
			roles: new Map(),
			attachments: new Map(),
			messages: new Map(),
		};

		if (data.data!.resolved?.users) {
			for (const [id, u] of Object.entries(data.data!.resolved.users)) {
				this.resolved.users.set(id, new User(session, u));
			}
		}

		if (data.data!.resolved?.members && !!super.guildId) {
			for (const [id, m] of Object.entries(data.data!.resolved.members)) {
				this.resolved.members.set(
					id,
					new Member(
						session,
						m as DiscordMemberWithUser,
						super.guildId!
					)
				);
			}
		}

		if (data.data!.resolved?.roles && !!super.guildId) {
			for (const [id, r] of Object.entries(data.data!.resolved.roles)) {
				this.resolved.roles.set(
					id,
					new Role(session, r, super.guildId!)
				);
			}
		}

		if (data.data!.resolved?.attachments) {
			for (const [id, a] of Object.entries(
				data.data!.resolved.attachments
			)) {
				this.resolved.attachments.set(id, new Attachment(session, a));
			}
		}

		if (data.data!.resolved?.messages) {
			for (const [id, m] of Object.entries(
				data.data!.resolved.messages
			)) {
				this.resolved.messages.set(id, new Message(session, m));
			}
		}

        this.locale = super.locale!;
	}

	override type: InteractionTypes.ApplicationCommand;
	commandId: Snowflake;
	commandName: string;
	commandType: ApplicationCommandTypes;
	commandGuildId?: Snowflake;
	resolved: CommandInteractionDataResolved;
	options: InteractionOptions;
    override locale: string;
}

export type ModalInMessage = ModalSubmitInteraction & {
	message: Message;
};

export class ModalSubmitInteraction extends BaseInteraction implements Model {
	constructor(session: Session, data: DiscordInteraction) {
		super(session, data);
		this.type = data.type as number;
		this.componentType = data.data!.component_type!;
		this.customId = data.data!.custom_id;
		this.targetId = data.data!.target_id;
		this.values = data.data!.values;

		this.components = data.data?.components?.map(
			ModalSubmitInteraction.transformComponent
		);

		if (data.message) {
			this.message = new Message(session, data.message);
		}

        this.locale = super.locale!;
	}

	override type: InteractionTypes.MessageComponent;
	componentType: MessageComponentTypes;
	customId?: string;
	targetId?: Snowflake;
	values?: string[];
	message?: Message;
	components;
    override locale: string;

	static transformComponent(component: DiscordMessageComponents[number]) {
		return {
			type: component.type,
			components: component.components.map(component => {
				return {
					customId: component.custom_id,
					value: (component as typeof component & { value: string })
						.value,
				};
			}),
		};
	}

	inMessage(): this is ModalInMessage {
		return !!this.message;
	}
}

export class PingInteraction extends BaseInteraction implements Model {
	constructor(session: Session, data: DiscordInteraction) {
		super(session, data);
		this.type = data.type as number;
		this.commandId = data.data!.id;
		this.commandName = data.data!.name;
		this.commandType = data.data!.type;
		this.commandGuildId = data.data!.guild_id;
        this.locale = super.locale as undefined;
	}

	override type: InteractionTypes.Ping;
	commandId: Snowflake;
	commandName: string;
	commandType: ApplicationCommandTypes;
	commandGuildId?: Snowflake;
    override locale: undefined;

	async pong(): Promise<void> {
		await this.session.rest.post<undefined>(
			INTERACTION_ID_TOKEN(this.id, this.token),
			{
				type: InteractionResponseTypes.Pong,
			}
		);
	}
}

export class ComponentInteraction extends BaseInteraction implements Model {
	constructor(session: Session, data: DiscordInteraction) {
		super(session, data);
		this.type = data.type as number;
		this.componentType = data.data!.component_type!;
		this.customId = data.data!.custom_id;
		this.targetId = data.data!.target_id;
		this.values = data.data!.values;
		this.message = new Message(session, data.message!);
        this.locale = super.locale!;
	}

	override type: InteractionTypes.MessageComponent;
	componentType: MessageComponentTypes;
	customId?: string;
	targetId?: Snowflake;
	values?: string[];
	message: Message;
    override locale: string;

	isButton(): boolean {
		return this.componentType === MessageComponentTypes.Button;
	}

	isActionRow(): boolean {
		return this.componentType === MessageComponentTypes.ActionRow;
	}

	isTextInput(): boolean {
		return this.componentType === MessageComponentTypes.InputText;
	}

	isSelectMenu(): boolean {
		return this.componentType === MessageComponentTypes.SelectMenu;
	}

	async deferUpdate() {
		await this.respond({
			type: InteractionResponseTypes.DeferredUpdateMessage,
		});
	}
}

/**
 * @link https://discord.com/developers/docs/interactions/receiving-and-responding#message-interaction-object-message-interaction-structure
 */
export interface MessageInteraction {
	/** id of the interaction */
	id: Snowflake;
	/** type of interaction */
	type: InteractionTypes;
	/** name of the application command, including subcommands and subcommand groups */
	name: string;
	/** user who invoked the interaction */
	user: User;
	/** member who invoked the interaction in the guild */
	member?: Partial<Member>;
}

export type Interaction =
	| CommandInteraction
	| ComponentInteraction
	| PingInteraction
	| AutoCompleteInteraction
	| ModalSubmitInteraction;

export class InteractionFactory {
	static from(
		session: Session,
		interaction: DiscordInteraction
	): Interaction {
		switch (interaction.type) {
			case InteractionTypes.Ping:
				return new PingInteraction(session, interaction);
			case InteractionTypes.ApplicationCommand:
				return new CommandInteraction(session, interaction);
			case InteractionTypes.MessageComponent:
				return new ComponentInteraction(session, interaction);
			case InteractionTypes.ApplicationCommandAutocomplete:
				return new AutoCompleteInteraction(session, interaction);
			case InteractionTypes.ModalSubmit:
				return new ModalSubmitInteraction(session, interaction);
		}
	}

	static fromMessage(
		session: Session,
		interaction: DiscordMessageInteraction,
		_guildId?: Snowflake
	): MessageInteraction {
		const obj = {
			id: interaction.id,
			type: interaction.type,
			name: interaction.name,
			user: new User(session, interaction.user),
			// TODO: Parse member somehow with the guild id passed in message
		};

		return obj;
	}
}

