import type { Model } from "../Base.ts";
import type { Session } from "../../Session.ts";
import type {
    DiscordInteraction,
    DiscordMessage,
    DiscordMessageComponents,
} from "../../../discordeno/mod.ts";
import type CommandInteraction from "./CommandInteraction.ts";
import type PingInteraction from "./PingInteraction.ts";
import type ComponentInteraction from "./ComponentInteraction.ts";
import type ModalSubmitInteraction from "./ModalSubmitInteraction.ts";
import type AutoCompleteInteraction from "./AutoCompleteInteraction.ts";
import type { CreateMessage } from "../Message.ts";
import type { MessageFlags } from "../../Util.ts";
import type { EditWebhookMessage } from "../Webhook.ts";
import { InteractionTypes, InteractionResponseTypes } from "../../../discordeno/mod.ts";
import { Snowflake } from "../../Snowflake.ts";
import User from "../User.ts";
import Member from "../Member.ts";
import Message from "../Message.ts";
import Permsisions from "../Permissions.ts";
import Webhook from "../Webhook.ts";
import * as Routes from "../../Routes.ts";


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
    extends Pick<CreateMessage, "allowedMentions" | "content" | "embeds" | "files"> {
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

        // @ts-expect-error: vendor error
        const perms = data.app_permissions as string;

        if (perms) {
            this.appPermissions = new Permsisions(BigInt(perms));
        }

        if (!data.guild_id) {
            this.user = new User(session, data.user!);
        } else {
            this.member = new Member(session, data.member!, data.guild_id);
        }
    }

    readonly session: Session;
    readonly id: Snowflake;
    readonly token: string;

    type: InteractionTypes;
    guildId?: Snowflake;
    channelId?: Snowflake;
    applicationId?: Snowflake;
    user?: User;
    member?: Member;
    appPermissions?: Permsisions;

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

    async editReply(options: EditWebhookMessage & { messageId?: Snowflake }): Promise<Message | undefined> {
        const message = await this.session.rest.runMethod<DiscordMessage | undefined>(
            this.session.rest,
            "PATCH",
            options.messageId
                ? Routes.WEBHOOK_MESSAGE(this.id, this.token, options.messageId)
                : Routes.WEBHOOK_MESSAGE_ORIGINAL(this.id, this.token),
            {
                content: options.content,
                embeds: options.embeds,
                file: options.files,
                components: options.components,
                allowed_mentions: options.allowedMentions || {
                    parse: options.allowedMentions!.parse,
                    replied_user: options.allowedMentions!.repliedUser,
                    users: options.allowedMentions!.users,
                    roles: options.allowedMentions!.roles,
                },
                attachments: options.attachments?.map((attachment) => {
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

    async sendFollowUp(options: InteractionApplicationCommandCallbackData): Promise<Message> {
        const message = await Webhook.prototype.execute.call({
            id: this.applicationId!,
            token: this.token,
            session: this.session,
        }, options);

        return message!;
    }

    async editFollowUp(messageId: Snowflake, options?: { threadId: Snowflake }): Promise<Message> {
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

    async deleteFollowUp(messageId: Snowflake, options?: { threadId?: Snowflake }): Promise<void> {
        await Webhook.prototype.deleteMessage.call(
            {
                id: this.session.applicationId,
                token: this.token
            },
            messageId,
            options
        );
    }

    async fetchFollowUp(messageId: Snowflake, options?: { threadId?: Snowflake }): Promise<Message | undefined> {
        const message = await Webhook.prototype.fetchMessage.call(
            {
                id: this.session.applicationId,
                token: this.token,
            },
            messageId,
            options
        );

        return message;
    }

    // end webhook methods

    // deno-fmt-ignore
    async respond(resp: InteractionResponse): Promise<Message | undefined>;
    async respond(resp: { with: InteractionApplicationCommandCallbackData }): Promise<Message | undefined>;
    async respond(resp: InteractionResponse | { with: InteractionApplicationCommandCallbackData }): Promise<Message | undefined> {
        const options = "with" in resp ? resp.with : resp.data;
        const type = "type" in resp ? resp.type : InteractionResponseTypes.ChannelMessageWithSource;

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
            await this.session.rest.sendRequest<undefined>(this.session.rest, {
                url: Routes.INTERACTION_ID_TOKEN(this.id, this.token),
                method: "POST",
                payload: this.session.rest.createRequestBody(this.session.rest, {
                    method: "POST",
                    body: { type, data, file: options?.files },
                    headers: { "Authorization": "" },
                }),
            });

            this.responded = true;
            return;
        }

        return this.sendFollowUp(data);
    }

    // start custom methods

    async respondWith(resp: InteractionApplicationCommandCallbackData): Promise<Message | undefined> {
        const m = await this.respond({ with: resp });

        return m;
    }

    async defer() {
        await this.respond({ type: InteractionResponseTypes.DeferredChannelMessageWithSource });
    }

    async autocomplete() {
        await this.respond({ type: InteractionResponseTypes.ApplicationCommandAutocompleteResult });
    }

    // end custom methods
}

export default BaseInteraction;
