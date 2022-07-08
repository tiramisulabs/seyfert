import type { Model } from "../Base.ts";
import type { Snowflake } from "../../util/Snowflake.ts";
import type { Session } from "../../session/Session.ts";
import type { ChannelTypes, DiscordChannel, DiscordThreadMember } from "../../vendor/external.ts";
import GuildChannel from "./GuildChannel.ts";
import TextChannel from "./TextChannel.ts";
import ThreadMember from "../ThreadMember.ts";
import * as Routes from "../../util/Routes.ts";

export class ThreadChannel extends GuildChannel implements Model {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data, guildId);
        this.type = data.type as number;
        this.archived = !!data.thread_metadata?.archived;
        this.archiveTimestamp = data.thread_metadata?.archive_timestamp;
        this.autoArchiveDuration = data.thread_metadata?.auto_archive_duration;
        this.locked = !!data.thread_metadata?.locked;
        this.messageCount = data.message_count;
        this.memberCount = data.member_count;
        this.ownerId = data.owner_id;

        if (data.member) {
            this.member = new ThreadMember(session, data.member);
        }
    }

    override type: ChannelTypes.GuildNewsThread | ChannelTypes.GuildPrivateThread | ChannelTypes.GuildPublicThread;
    archived?: boolean;
    archiveTimestamp?: string;
    autoArchiveDuration?: number;
    locked?: boolean;
    messageCount?: number;
    memberCount?: number;
    member?: ThreadMember;
    ownerId?: Snowflake;

    async joinThread() {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "PUT",
            Routes.THREAD_ME(this.id),
        );
    }

    async addToThread(guildMemberId: Snowflake) {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "PUT",
            Routes.THREAD_USER(this.id, guildMemberId),
        );
    }

    async leaveToThread(guildMemberId: Snowflake) {
        await this.session.rest.runMethod<undefined>(
            this.session.rest,
            "DELETE",
            Routes.THREAD_USER(this.id, guildMemberId),
        );
    }

    removeMember(memberId: Snowflake = this.session.botId) {
        return ThreadMember.prototype.quitThread.call({ id: this.id, session: this.session }, memberId);
    }

    fetchMember(memberId: Snowflake = this.session.botId) {
        return ThreadMember.prototype.fetchMember.call({ id: this.id, session: this.session }, memberId);
    }

    async fetchMembers(): Promise<ThreadMember[]> {
        const members = await this.session.rest.runMethod<DiscordThreadMember[]>(
            this.session.rest,
            "GET",
            Routes.THREAD_MEMBERS(this.id),
        );

        return members.map((threadMember) => new ThreadMember(this.session, threadMember));
    }
}

TextChannel.applyTo(ThreadChannel);

export interface ThreadChannel extends Omit<GuildChannel, "type">, Omit<TextChannel, "type"> {}

export default ThreadChannel;
