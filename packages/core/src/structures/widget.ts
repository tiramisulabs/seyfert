import type { Model } from './base';
import type { Session } from '../biscuit';
import type { Snowflake } from '../snowflakes';
import type { DiscordGuildWidget } from '@biscuitland/api-types';
import type { PartialChannel } from './channels';

export interface WidgetMember {
	id?: string;
	username: string;
	avatar?: string | null;
	status: string;
	avatarURL: string;
}

export class Widget implements Model {
	constructor(session: Session, data: DiscordGuildWidget) {
		this.session = session;
		this.id = data.id;
		this.name = data.name;
		this.instantInvite = data.instant_invite;
		this.channels = data.channels;
		this.members = data.members.map(x => {
			return {
				id: x.id,
				username: x.username,
				avatar: x.avatar,
				status: x.status,
				avatarURL: x.avatar_url,
			};
		});
		this.presenceCount = data.presence_count;
	}

	session: Session;
	id: Snowflake;
	name: string;
	instantInvite?: string;
	channels: PartialChannel[];
	members: WidgetMember[];
	presenceCount: number;
}
