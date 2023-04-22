import { MakeRequired } from '@biscuitland/common';
import type { APIThreadMember, GatewayThreadMemberUpdateDispatchData, ThreadMemberFlags } from '@biscuitland/common';
import type { Session } from '../session';
import { Base } from './extra/Base';
import { DiscordBase } from './extra/DiscordBase';

export type ThreadMemberData = GatewayThreadMemberUpdateDispatchData | APIThreadMember;

/**
 * A member that comes from a thread
 * @link https://discord.com/developers/docs/resources/channel#thread-member-object
 */
export class ThreadMember extends DiscordBase {
	constructor(session: Session, data: MakeRequired<ThreadMemberData, 'user_id'>) {
		super(session, data.user_id);
		this.threadId = data.id;
		this.joinTimestamp = Date.parse(data.join_timestamp);
		this.flags = data.flags;

		if ('guild_id' in data) {
			this.guildId = data.guild_id;
		}
	}

	/**	ID of the thread */
	threadId?: string;

	/**	Time the user last joined the thread */
	joinTimestamp: number;

	/** Any user-thread settings, currently only used for notifications */
	flags: ThreadMemberFlags;

	/**	ID of the guild */
	guildId?: string;
}

/**
 * A member that comes from a thread emited on GUILD_CREATE event
 * @link https://discord.com/developers/docs/resources/channel#thread-member-object
 */
export class PartialThreadMember extends Base implements Omit<ThreadMember, 'id' | 'createdTimestamp' | 'createdAt'> {
	constructor(session: Session, data: ThreadMemberData) {
		super(session);
		this.threadId = data.id;
		this.joinTimestamp = Date.parse(data.join_timestamp);
		this.flags = data.flags;

		if ('guild_id' in data) {
			this.guildId = data.guild_id;
		}
	}

	/**	ID of the thread */
	threadId?: string;

	/**	Time the user last joined the thread */
	joinTimestamp: number;

	/** Any user-thread settings, currently only used for notifications */
	flags: ThreadMemberFlags;

	/**	ID of the guild */
	guildId?: string;
}
