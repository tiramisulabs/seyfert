import type { APIUser, MessageCreateBodyRequest, ObjectToLower } from '../common';
import type { ImageOptions } from '../common/types/options';
import { DiscordBase } from './extra/DiscordBase';

export interface User extends ObjectToLower<APIUser> {}

export class User extends DiscordBase<APIUser> {
	get tag() {
		return this.globalName ?? `${this.username}#${this.discriminator}`;
	}

	get name() {
		return this.globalName ?? this.username;
	}

	/**
	 * Fetch user
	 */
	fetch(force = false) {
		return this.client.users.fetch(this.id, force);
	}

	/**
	 * Open a DM with the user
	 */
	dm(force = false) {
		return this.client.users.createDM(this.id, force);
	}

	write(body: MessageCreateBodyRequest) {
		return this.client.users.write(this.id, body);
	}

	avatarURL(options?: ImageOptions) {
		if (!this.avatar) {
			return this.rest.cdn.defaultAvatar(Number(this.discriminator));
		}
		return this.rest.cdn.avatar(this.id, this.avatar, options);
	}

	presence() {
		return this.cache.presences?.get(this.id);
	}

	toString() {
		return `<@${this.id}>`;
	}
}
