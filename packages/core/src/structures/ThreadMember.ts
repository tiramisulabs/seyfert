import type { APIThreadMember, ThreadMemberFlags } from 'discord-api-types/v10';
import type { Session } from '../session';
import { Base } from './extra/base';

/**
 * A member that comes from a thread
 * @link https://discord.com/developers/docs/resources/channel#thread-member-object
 */
export class ThreadMember extends Base {
	constructor(session: Session, data: APIThreadMember) {
		super(session, `${data.user_id}`);
		this.id = `${data.user_id}`;
		this.threadId = data.id;
		this.joinTimestamp = Date.parse(data.join_timestamp);
		this.flags = data.flags;
	}

	/**
	 * ID of the user
	 * This field is omitted on the member sent within each thread in the GUILD_CREATE event.
	 */
	override readonly id: string;

	/**	ID of the thread */
	threadId?: string;

	/**	Time the user last joined the thread */
	joinTimestamp: number;

	/** Any user-thread settings, currently only used for notifications */
	flags: ThreadMemberFlags;
}
