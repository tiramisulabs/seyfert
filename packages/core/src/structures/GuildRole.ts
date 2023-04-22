import type { APIRole } from '@biscuitland/common';
import type { Session } from '../session';
import { DiscordBase } from './extra/DiscordBase';
import { RoleTag } from './extra/RoleTag';

export class Role extends DiscordBase {
	// rome-ignore lint/correctness/noUnusedVariables: Declaring them here avoids reassigning them manually
	constructor(session: Session, data: APIRole, readonly guildId: string) {
		super(session, data.id);
		this.name = data.name;
		this.color = data.color;
		this.hoist = !!data.hoist;
		this.position = data.position;
		this.permissions = data.permissions;
		this.managed = !!data.managed;
		this.mentionable = !!data.mentionable;
		this.icon = data.icon ?? undefined;
		this.unicodeEmoji = data.unicode_emoji ?? undefined;

		if (Array.isArray(data.tags)) {
			this.tags = data.tags.map((tag) => new RoleTag(tag));
		}
	}

	/** role name */
	name: string;

	/** integer representation of hexadecimal color code */
	color: number;

	/** if this role is pinned in the user listing */
	hoist: boolean;

	/** position of this role */
	position: number;

	/** permissions bit set */
	permissions: string; // BITFIELD TODO

	/** whether this role is managed by an integration */
	managed: boolean;

	/** whether this role is mentionable */
	mentionable: boolean;

	/** role icon hash */
	icon?: string;

	/** role unicode emoji */
	unicodeEmoji?: string;

	/** the tags this role has */
	tags?: RoleTag[];
}
