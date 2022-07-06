import type { Model } from "../Base.ts";
import type { Snowflake } from "../../util/Snowflake.ts";
import type { Session } from "../../session/Session.ts";
import type {
    ChannelTypes,
    DiscordChannel,
    DiscordInviteMetadata,
    DiscordListArchivedThreads,
} from "../../vendor/external.ts";
import type { ListArchivedThreads } from "../../util/Routes.ts";
import BaseChannel from "./BaseChannel.ts";
import ThreadMember from "../ThreadMember.ts";
import Invite from "../Invite.ts";
import * as Routes from "../../util/Routes.ts";

/**
 * Represent the options object to create a thread channel
 * @link https://discord.com/developers/docs/resources/channel#start-thread-without-message
 */
export interface ThreadCreateOptions {
    name: string;
    autoArchiveDuration?: 60 | 1440 | 4320 | 10080;
    type: 10 | 11 | 12;
    invitable?: boolean;
    rateLimitPerUser?: number;
    reason?: string;
}

/**
 * Represents the option object to create a thread channel from a message
 * @link https://discord.com/developers/docs/resources/channel#start-thread-from-message
 */
export interface ThreadCreateOptions {
    name: string;
    autoArchiveDuration?: 60 | 1440 | 4320 | 10080;
    rateLimitPerUser?: number;
    messageId: Snowflake;
}

export class GuildChannel extends BaseChannel implements Model {
    constructor(session: Session, data: DiscordChannel, guildId: Snowflake) {
        super(session, data);
        this.type = data.type as number;
        this.guildId = guildId;
        this.position = data.position;
        data.topic ? this.topic = data.topic : null;
        data.parent_id ? this.parentId = data.parent_id : undefined;
    }

    override type: Exclude<ChannelTypes, ChannelTypes.DM | ChannelTypes.GroupDm>;
    guildId: Snowflake;
    topic?: string;
    position?: number;
    parentId?: Snowflake;

    async fetchInvites(): Promise<Invite[]> {
        const invites = await this.session.rest.runMethod<DiscordInviteMetadata[]>(
            this.session.rest,
            "GET",
            Routes.CHANNEL_INVITES(this.id),
        );

        return invites.map((invite) => new Invite(this.session, invite));
    }

    /*
    async getArchivedThreads(options: ListArchivedThreads & { type: "public" | "private" | "privateJoinedThreads" }) {
        let func: (channelId: Snowflake, options: ListArchivedThreads) => string;

        switch (options.type) {
            case "public":
                func = Routes.THREAD_ARCHIVED_PUBLIC;
                break;
            case "private":
                func = Routes.THREAD_START_PRIVATE;
                break;
            case "privateJoinedThreads":
                func = Routes.THREAD_ARCHIVED_PRIVATE_JOINED;
                break;
        }

        const { threads, members, has_more } = await this.session.rest.runMethod<DiscordListArchivedThreads>(
            this.session.rest,
            "GET",
            func(this.id, options),
        );

        return {
            threads: Object.fromEntries(
                threads.map((thread) => [thread.id, new ThreadChannel(this.session, thread, this.id)]),
            ) as Record<Snowflake, ThreadChannel>,
            members: Object.fromEntries(
                members.map((threadMember) => [threadMember.id, new ThreadMember(this.session, threadMember)]),
            ) as Record<Snowflake, ThreadMember>,
            hasMore: has_more,
        };
    }

    async createThread(options: ThreadCreateOptions): Promise<ThreadChannel> {
        const thread = await this.session.rest.runMethod<DiscordChannel>(
            this.session.rest,
            "POST",
            "messageId" in options
                ? Routes.THREAD_START_PUBLIC(this.id, options.messageId)
                : Routes.THREAD_START_PRIVATE(this.id),
            {
                name: options.name,
                auto_archive_duration: options.autoArchiveDuration,
            },
        );

        return new ThreadChannel(this.session, thread, thread.guild_id ?? this.guildId);
    }*/
}


export default GuildChannel;
