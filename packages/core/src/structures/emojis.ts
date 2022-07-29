import type { Session } from '../biscuit';
import type { Model } from './base';
import type { Snowflake } from '../snowflakes';
import type { DiscordEmoji } from '@biscuitland/api-types';
import type { ModifyGuildEmoji } from './guilds';
import { Guild } from './guilds';
import { User } from './user';
import { EMOJI_URL } from '@biscuitland/api-types';

export class Emoji implements Partial<Model> {
	constructor(session: Session, data: DiscordEmoji) {
		this.id = data.id;
		this.name = data.name;
		this.animated = !!data.animated;
		this.available = !!data.available;
		this.requireColons = !!data.require_colons;
		this.session = session;
	}

	readonly id?: Snowflake;
	readonly session: Session;

	name?: string;
	animated: boolean;
	available: boolean;
	requireColons: boolean;
}

export class GuildEmoji extends Emoji implements Model {
	constructor(session: Session, data: DiscordEmoji, guildId: Snowflake) {
		super(session, data);
		this.guildId = guildId;
		this.roles = data.roles;
		this.user = data.user ? new User(this.session, data.user) : undefined;
		this.managed = !!data.managed;
		this.id = super.id!;
	}

	guildId: Snowflake;
	roles?: Snowflake[];
	user?: User;
	managed?: boolean;

	// id cannot be null in a GuildEmoji
	override id: Snowflake;

	async edit(options: ModifyGuildEmoji): Promise<GuildEmoji> {
		const emoji = await Guild.prototype.editEmoji.call(
			{ id: this.guildId, session: this.session },
			this.id,
			options
		);

		return emoji;
	}

	async delete(reason?: string): Promise<GuildEmoji> {
		await Guild.prototype.deleteEmoji.call(
			{ id: this.guildId, session: this.session },
			this.id,
			reason
		);

		return this;
	}

	get url(): string {
		return EMOJI_URL(this.id, this.animated);
	}
}
