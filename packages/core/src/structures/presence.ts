import type {
	ActivityTypes,
	DiscordActivityButton,
	DiscordActivitySecrets,
	DiscordClientStatus,
	DiscordPresenceUpdate,
} from '@biscuitland/api-types';
import type { Session } from '../biscuit';
import type { Snowflake } from '../snowflakes';
import type { ComponentEmoji } from '../utils/util';
import { User } from './user';

export interface ActivityAssets {
	largeImage?: string;
	largeText?: string;
	smallImage?: string;
	smallText?: string;
}

export interface Activities {
	name: string;
	type: ActivityTypes;
	url?: string;
	createdAt: number;
	timestamps?: {
		start?: number;
		end?: number;
	};
	applicationId?: Snowflake;
	details?: string;
	state?: string;
	emoji?: ComponentEmoji;
	party?: {
		id?: string;
		size?: number[];
	};
	assets?: ActivityAssets;
	secrets?: DiscordActivitySecrets;
	instance?: boolean;
	flags?: number;
	buttons?: DiscordActivityButton;
}

export enum StatusTypes {
	online = 0,
	dnd = 1,
	idle = 2,
	invisible = 3,
	offline = 4,
}

export class Presence {
	constructor(session: Session, data: DiscordPresenceUpdate) {
		this.session = session;
		this.user = new User(this.session, data.user);
		this.guildId = data.guild_id;
		this.status = StatusTypes[data.status];
		this.activities = data.activities.map<Activities>(activity =>
			Object({
				name: activity.name,
				type: activity.type,
				url: activity.url ? activity.url : undefined,
				createdAt: activity.created_at,
				timestamps: activity.timestamps,
				applicationId: activity.application_id,
				details: activity.details ? activity.details : undefined,
				state: activity.state,
				emoji: activity.emoji ? activity.emoji : undefined,
				party: activity.party ? activity.party : undefined,
				assets: activity.assets
					? {
							largeImage: activity.assets.large_image,
							largeText: activity.assets.large_text,
							smallImage: activity.assets.small_image,
							smallText: activity.assets.small_text,
					}
					: null,
				secrets: activity.secrets ? activity.secrets : undefined,
				instance: !!activity.instance,
				flags: activity.flags,
				buttons: activity.buttons,
			})
		);
		this.clientStatus = data.client_status;
	}

	session: Session;
	user: User;
	guildId: Snowflake;
	status: StatusTypes;
	activities: Activities[];
	clientStatus: DiscordClientStatus;
}
