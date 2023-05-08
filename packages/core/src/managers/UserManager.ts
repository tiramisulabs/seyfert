import type { APIUser } from '@biscuitland/common';
import type { Session, ImageOptions } from '../index';
import { formatImageURL } from '../index';

export class UserManager {
	readonly session!: Session;
	constructor(session: Session) {
		Object.defineProperty(this, 'session', {
			value: session,
			writable: false
		});
	}

	async fetch(userId: string) {
		return await this.session.api.users(userId).get<APIUser>();
	}

	avatarURL(user: APIUser, { size, format }: ImageOptions) {
		if (user.avatar?.length) {
			return formatImageURL(this.session.cdn.avatars(user.id).get(user.avatar), size, format);
		}

		return formatImageURL(this.session.cdn.embed.avatars.get(Number(user.discriminator) % 5));
	}
}
