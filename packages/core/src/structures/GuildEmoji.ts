import type { APIEmoji } from 'discord-api-types/v10';
import type { Session } from '../session';
import { Base } from './extra/base';
import type { Emoji } from './extra/Emoji';
import { User } from './User';


export class GuildEmoji extends Base implements Emoji {
	constructor(session: Session, data: APIEmoji, readonly guildId: string) {
		super(session, data.id!);
		this.name = data.name!;
		this.managed = !!data.managed;
		this.animated = !!data.animated;
		this.avialable = !!data.available;
		this.requireColons = !!data.require_colons;
		this.roles = data.roles;

		if (data.user) { this.user = new User(this.session, data.user); }
	}

	name: string;
	managed: boolean;
	animated: boolean;
	avialable: boolean;
	requireColons: boolean;
	roles?: string[];
	user?: User;
}
