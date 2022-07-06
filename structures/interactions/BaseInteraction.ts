import type { Model } from "../Base.ts";
import type { Session } from "../../session/Session.ts";
import type { DiscordInteraction } from "../../vendor/external.ts";
import type CommandInteraction from "./CommandInteraction.ts";
import type PingInteraction from "./PingInteraction.ts";
import { InteractionTypes } from "../../vendor/external.ts";
import { Snowflake } from "../../util/Snowflake.ts";
import User from "../User.ts";
import Member from "../Member.ts";
import Permsisions from "../Permissions.ts";

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

    get createdTimestamp() {
        return Snowflake.snowflakeToTimestamp(this.id);
    }

    get createdAt() {
        return new Date(this.createdTimestamp);
    }

    isCommand(): this is CommandInteraction {
        return this.type === InteractionTypes.ApplicationCommand;
    }

    isAutoComplete() {
        return this.type === InteractionTypes.ApplicationCommandAutocomplete;
    }

    isComponent() {
        return this.type === InteractionTypes.MessageComponent;
    }

    isPing(): this is PingInteraction {
        return this.type === InteractionTypes.Ping;
    }

    isModalSubmit() {
        return this.type === InteractionTypes.ModalSubmit;
    }

    inGuild() {
        return !!this.guildId;
    }
}

export default BaseInteraction;
