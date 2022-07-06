import type { Model } from "../Base.ts";
import type { Snowflake } from "../../util/Snowflake.ts";
import type { Session } from "../../session/Session.ts";
import type { ApplicationCommandTypes, DiscordMemberWithUser, DiscordInteraction, InteractionTypes } from "../../vendor/external.ts";
import type { CreateMessage } from "../Message.ts";
import type { MessageFlags } from "../../util/shared/flags.ts";
import { InteractionResponseTypes } from "../../vendor/external.ts";
import BaseInteraction from "./BaseInteraction.ts";
import CommandInteractionOptionResolver from "./CommandInteractionOptionResolver.ts";
import Attachment from "../Attachment.ts";
import User from "../User.ts";
import Member from "../Member.ts";
import Message from "../Message.ts";
import Role from "../Role.ts";
import Webhook from "../Webhook.ts";
import * as Routes from "../../util/Routes.ts";

/**
 * @link https://discord.com/developers/docs/interactions/slash-commands#interaction-response
 * */
export interface InteractionResponse {
    type: InteractionResponseTypes;
    data?: InteractionApplicationCommandCallbackData;
}

/**
 * @link https://discord.com/developers/docs/interactions/slash-commands#interaction-response-interactionapplicationcommandcallbackdata
 * */
export interface InteractionApplicationCommandCallbackData extends Pick<CreateMessage, "allowedMentions" | "content" | "embeds" | "files"> {
    customId?: string;
    title?: string;
    // components?: MessageComponents;
    flags?: MessageFlags;
    choices?: ApplicationCommandOptionChoice[];
}

/**
 * @link https://discord.com/developers/docs/interactions/slash-commands#applicationcommandoptionchoice
 * */
export interface ApplicationCommandOptionChoice {
  name: string;
  value: string | number;
}

export class CommandInteraction extends BaseInteraction implements Model {
    constructor(session: Session, data: DiscordInteraction) {
        super(session, data);
        this.type = data.type as number;
        this.commandId = data.data!.id;
        this.commandName = data.data!.name;
        this.commandType = data.data!.type;
        this.commandGuildId = data.data!.guild_id;
        this.options = new CommandInteractionOptionResolver(data.data!.options ?? []);

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
                this.resolved.members.set(id, new Member(session, m as DiscordMemberWithUser, super.guildId!));
            }
        }

        if (data.data!.resolved?.roles && !!super.guildId) {
            for (const [id, r] of Object.entries(data.data!.resolved.roles)) {
                this.resolved.roles.set(id, new Role(session, r, super.guildId!));
            }
        }

        if (data.data!.resolved?.attachments) {
            for (const [id, a] of Object.entries(data.data!.resolved.attachments)) {
                this.resolved.attachments.set(id, new Attachment(session, a));
            }
        }

        if (data.data!.resolved?.messages) {
            for (const [id, m] of Object.entries(data.data!.resolved.messages)) {
                this.resolved.messages.set(id, new Message(session, m));
            }
        }
    }

    override type: InteractionTypes.ApplicationCommand;
    commandId: Snowflake;
    commandName: string;
    commandType: ApplicationCommandTypes;
    commandGuildId?: Snowflake;
    resolved: {
        users: Map<Snowflake, User>;
        members: Map<Snowflake, Member>;
        roles: Map<Snowflake, Role>;
        attachments: Map<Snowflake, Attachment>;
        messages: Map<Snowflake, Message>;
    };
    options: CommandInteractionOptionResolver;
    responded = false;

    async sendFollowUp(options: InteractionApplicationCommandCallbackData): Promise<Message> {
        const message = await Webhook.prototype.execute.call({
            id: this.applicationId!,
            token: this.token,
            session: this.session,
        }, options);

        return message!;
    }

    async respond({ type, data: options }: InteractionResponse): Promise<Message | undefined> {
        const data = {
            content: options?.content,
            custom_id: options?.customId,
            file: options?.files,
            allowed_mentions: options?.allowedMentions,
            flags: options?.flags,
            chocies: options?.choices,
            embeds: options?.embeds,
            title: options?.title,
        };

        if (!this.respond) {
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
}

export default CommandInteraction;
