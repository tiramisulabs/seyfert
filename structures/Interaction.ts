import type { Model } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type {
    DiscordMessage,
    DiscordInteraction,
    InteractionTypes,
    InteractionResponseTypes,
    FileContent,
} from "../vendor/external.ts";
import type { MessageFlags } from "../util/shared/flags.ts";
import type { AllowedMentions } from "./Message.ts";
import User from "./User.ts";
import Message from "./Message.ts";
import Member from "./Member.ts";
import * as Routes from "../util/Routes.ts";

export interface InteractionResponse {
    type: InteractionResponseTypes;
    data?: InteractionApplicationCommandCallbackData;
}

export interface InteractionApplicationCommandCallbackData {
    content?: string;
    tts?: boolean;
    allowedMentions?: AllowedMentions;
    files?: FileContent[];
    customId?: string;
    title?: string;
    // components?: Component[];
    flags?: MessageFlags;
    choices?: ApplicationCommandOptionChoice[];
}

/** https://discord.com/developers/docs/interactions/slash-commands#applicationcommandoptionchoice */
export interface ApplicationCommandOptionChoice {
  name: string;
  value: string | number;
}

export class Interaction implements Model {
    constructor(session: Session, data: DiscordInteraction) {
        this.session = session;
        this.id = data.id;
        this.token = data.token;
        this.type = data.type
        this.guildId = data.guild_id;
        this.channelId = data.channel_id;
        this.applicationId = data.application_id;
        this.locale = data.locale;
        this.data = data.data;

        if (!data.guild_id) {
            this.user = new User(session, data.user!);
        }
        else {
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
    locale?: string;
    // deno-lint-ignore no-explicit-any
    data: any;
    user?: User;
    member?: Member;

    async respond({ type, data }: InteractionResponse) {
        const toSend = {
            tts: data?.tts,
            title: data?.title,
            flags: data?.flags,
            content: data?.content,
            choices: data?.choices,
            custom_id: data?.customId,
            allowed_mentions: data?.allowedMentions
                ? {
                    users: data.allowedMentions.users,
                    roles: data.allowedMentions.roles,
                    parse: data.allowedMentions.parse,
                    replied_user: data.allowedMentions.repliedUser,
                }
                : { parse: [] },
        };

        if (this.session.unrepliedInteractions.delete(BigInt(this.id))) {
            await this.session.rest.sendRequest<undefined>(
                this.session.rest,
                {
                    url: Routes.INTERACTION_ID_TOKEN(this.id, this.token),
                    method: "POST",
                    payload: this.session.rest.createRequestBody(this.session.rest, {
                        method: "POST",
                        body: {
                            type: type,
                            data: toSend,
                            file: data?.files,
                        },
                        headers: {
                          // remove authorization header
                          Authorization: "",
                        },
                    }),
                }
            );

            return;
        }

        const result = await this.session.rest.sendRequest<DiscordMessage>(
            this.session.rest,
            {
                url: Routes.WEBHOOK(this.session.botId, this.token),
                method: "POST",
                payload: this.session.rest.createRequestBody(this.session.rest, {
                    method: "POST",
                    body: {
                        ...toSend,
                        file: data?.files
                    },
                    headers: {
                        // remove authorization header
                        Authorization: "",
                    },
                }),
            }
        );

        return new Message(this.session, result);
    }

    inGuild(): this is Interaction & { user: undefined, guildId: Snowflake, member: Member } {
        return "guildId" in this;
    }
}

export default Interaction;
