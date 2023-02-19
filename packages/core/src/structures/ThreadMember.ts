import type { APIThreadMember, GatewayThreadMemberUpdateDispatchData, ThreadMemberFlags } from "discord-api-types/v10";
import type { Session } from "../session";
import { Base } from "./extra/Base";

export type ThreadMemberData = GatewayThreadMemberUpdateDispatchData | APIThreadMember;

/**
 * A member that comes from a thread
 * @link https://discord.com/developers/docs/resources/channel#thread-member-object
 */
export class ThreadMember extends Base {
	constructor(session: Session, data: ThreadMemberData) {
		super(session, data.user_id);
		this.threadId = data.id;
		this.joinTimestamp = Date.parse(data.join_timestamp);
		this.flags = data.flags;

		if ("guild_id" in data) {
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
