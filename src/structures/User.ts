import type { APIUser } from 'discord-api-types/v10';
import type { MessageCreateBodyRequest, ObjectToLower } from '../common';
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
			const avatarIndex =
				this.discriminator === '0' ? Number(BigInt(this.id) >> 22n) % 6 : Number.parseInt(this.discriminator) % 5;
			return this.rest.cdn.embed.avatars.get(avatarIndex);
		}
		return this.rest.cdn.avatars(this.id).get(this.avatar, options);
	}

	avatarDecorationURL(options?: ImageOptions) {
		if (!this.avatarDecoration) return;
		return this.rest.cdn['avatar-decorations'](this.id).get(this.avatarDecoration, options);
	}

	bannerURL(options?: ImageOptions) {
		if (!this.banner) return;
		return this.rest.cdn.banners(this.id).get(this.banner, options);
	}

	presence() {
		return this.client.members.presence(this.id);
	}

	toString() {
		return `<@${this.id}>`;
	}
}
