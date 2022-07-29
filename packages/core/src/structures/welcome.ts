import type { Session } from '../biscuit';
import type { Model } from './base';
import type { Snowflake } from '../snowflakes';
import type {
	DiscordWelcomeScreen,
	DiscordWelcomeScreenChannel,
} from '@biscuitland/api-types';
import { Emoji } from './emojis';

/**
 * Not a channel
 * @link https://discord.com/developers/docs/resources/guild#welcome-screen-object-welcome-screen-channel-structure
 */
export class WelcomeChannel implements Model {
	constructor(session: Session, data: DiscordWelcomeScreenChannel) {
		this.session = session;
		this.channelId = data.channel_id;
		this.description = data.description;
		this.emoji = new Emoji(session, {
			name: data.emoji_name ? data.emoji_name : undefined,
			id: data.emoji_id ? data.emoji_id : undefined,
		});
	}

	session: Session;
	channelId: Snowflake;
	description: string;
	emoji: Emoji;

	/** alias for WelcomeScreenChannel.channelId */
	get id(): Snowflake {
		return this.channelId;
	}
}

/**
 * @link https://discord.com/developers/docs/resources/guild#welcome-screen-object
 */
export class WelcomeScreen {
	constructor(session: Session, data: DiscordWelcomeScreen) {
		this.session = session;
		this.welcomeChannels = data.welcome_channels.map(
			welcomeChannel => new WelcomeChannel(session, welcomeChannel)
		);

		if (data.description) {
			this.description = data.description;
		}
	}

	readonly session: Session;

	description?: string;
	welcomeChannels: WelcomeChannel[];
}
