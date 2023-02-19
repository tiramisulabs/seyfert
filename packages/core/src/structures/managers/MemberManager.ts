import type { Session } from "../../session";
import { ImageOptions } from "../../utils/types";

export class MemberManager {
	constructor(private readonly session: Session) {}

	dynamicAvatarURL(guildId: string, memberId: string, avatar: string, options?: ImageOptions): string {
		return this.session.utils.formatImageURL(
			this.session.cdn.guilds(guildId).users(memberId).avatars(avatar).get(),
			options?.size,
			options?.format,
		);
	}
}
