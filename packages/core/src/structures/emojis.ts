import type { Session } from '../biscuit';
import type { Model } from './base';
import type { Snowflake } from '../snowflakes';
import { Guild, ModifyGuildEmoji} from './guilds';
import { User } from './user';
import { EMOJI_URL, DiscordEmoji, GUILD_EMOJIS } from '@biscuitland/api-types';

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

	async fetchAuthor(): Promise<User | null> {
		const emoji = await this.session.rest.get<DiscordEmoji>(GUILD_EMOJIS(this.guildId, this.id));

		if (emoji.user) return new User(this.session, emoji.user);
		return null;
	}

	setName(name: string): Promise<GuildEmoji> {
		return this.edit({ name: name });
	}

	get url(): string {
		return EMOJI_URL(this.id, this.animated);
	}

	toString(): string {
		return `<${this.animated ? 'a' : ''}:${this.name}:${this.id}>`
	}
}
