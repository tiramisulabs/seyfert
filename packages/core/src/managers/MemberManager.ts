import type { APIGuildMember, MakeRequired } from '@biscuitland/common';
import type { Session, ImageOptions } from '../index';
import { formatImageURL } from '../index';

export class MemberManager {
	constructor(private readonly session: Session) {}

	dynamicAvatarURL({ avatar, guild_id, user }: FullMember, { size, format }: ImageOptions): string {
		if (avatar?.length) {
			return formatImageURL(this.session.cdn.guilds(guild_id).users(user.id).avatars(avatar).get(), size, format);
		}

		return this.session.managers.users.avatarURL(user, { size, format });
	}
}

export type FullMember = MakeRequired<APIGuildMember, 'user'> & { guild_id: string };
