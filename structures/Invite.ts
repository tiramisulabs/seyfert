import type { Session } from "../session/Session.ts";
import type { DiscordInvite } from "../vendor/external.ts";
import { TargetTypes } from "../vendor/external.ts";
import InviteGuild from "./InviteGuild.ts";
import User from "./User.ts";
import Guild from "./Guild.ts";

/**
 * @link https://discord.com/developers/docs/resources/invite#invite-object
 */
export class Invite {
    constructor(session: Session, data: DiscordInvite) {
        this.session = session;

        if (data.guild) {
            this.guild = new InviteGuild(session, data.guild);
        }

        if (data.approximate_member_count) {
            this.approximateMemberCount = data.approximate_member_count;
        }

        if (data.approximate_presence_count) {
            this.approximatePresenceCount = data.approximate_presence_count;
        }

        // TODO: fix this
        // this.channel = data.channel;
        this.code = data.code;

        if (data.expires_at) {
            this.expiresAt = Number.parseInt(data.expires_at);
        }

        // TODO: fix this
        // this.xd = data.guild_scheduled_event

        if (data.inviter) {
            this.inviter = new User(session, data.inviter);
        }

        if (data.target_user) {
            this.targetUser = new User(session, data.target_user);
        }

        // TODO: fix this
        // this.stageInstance = data.stage_instance

        // TODO: fix this
        // this.targetApplication = data.target_application

        if (data.target_type) {
            this.targetType = data.target_type;
        }
    }

    readonly session: Session;
    guild?: InviteGuild;
    approximateMemberCount?: number;
    approximatePresenceCount?: number;
    code: string;
    expiresAt?: number;
    inviter?: User;
    targetUser?: User;
    targetType?: TargetTypes;

    async delete(): Promise<Invite> {
        await Guild.prototype.deleteInvite.call(this.guild, this.code);
        return this;
    }
}

export default Invite;
