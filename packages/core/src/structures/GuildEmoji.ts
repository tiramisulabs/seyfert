import type { APIEmoji } from "discord-api-types/v10";
import type { Session } from "../session";
import { Base } from "./extra/Base";
import type { Emoji } from "./extra/Emoji";
import { User } from "./User";

export class GuildEmoji extends Base implements Emoji {
	// rome-ignore lint/correctness/noUnusedVariables: Declaring them here avoids reassigning them manually
	constructor(session: Session, data: APIEmoji, readonly guildId: string) {
		super(session, data.id!);
		this.name = data.name!;
		this.id = data.id!;
		this.managed = !!data.managed;
		this.animated = !!data.animated;
		this.avialable = !!data.available;
		this.requireColons = !!data.require_colons;
		this.roles = data.roles;

		if (data.user) this.user = new User(this.session, data.user);
	}

	override id: string;

	/** emoji name */
	name: string;

	/** whether this emoji is managed */
	managed: boolean;

	/** whether this emoji is animated */
	animated: boolean;

	/** whether this emoji can be used, may be false due to loss of Server Boosts */
	avialable: boolean;

	/**	whether this emoji must be wrapped in colons */
	requireColons: boolean;

	/** roles allowed to use this emoji */
	roles?: string[];

	/** user that created this emoji */
	user?: User;
}
