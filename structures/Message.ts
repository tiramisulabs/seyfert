import type { Base } from "./Base.ts";
import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/mod.ts";
import type { DiscordMessage, AllowedMentionsTypes } from "../vendor/external.ts";
import { Routes } from "../util/mod.ts";

/** 
 * @link https://discord.com/developers/docs/resources/channel#allowed-mentions-object
 * */
export interface AllowedMentions {
	parse?: AllowedMentionsTypes[];
	repliedUser?: boolean;
	roles?: Snowflake[];
	users?: Snowflake[];
}

/** 
 * @link https://discord.com/developers/docs/resources/channel#edit-message-json-params
 * */
export interface EditMessage {
	content?: string;
	allowedMentions?: AllowedMentions;
}

/** 
 * @link https://discord.com/developers/docs/resources/channel#create-message-json-params
 * */
export interface CreateMessage {
	content?: string;
	allowedMentions?: AllowedMentions;
}

/**
 * Represents a message
 * @link https://discord.com/developers/docs/resources/channel#message-object
 * */
export class Message implements Base {
	constructor(session: Session, data: DiscordMessage) {
		this.session = session;

		this.id = data.id;

		this.channelId = data.channel_id;
	}

	/** the session that instantiated the message */
	session: Session;

	/** the id of the message */
	id: Snowflake;

	/** the id of the channel where the message was sent */
	channelId: Snowflake;

	/** Edits the current message */
	async edit({ content, allowedMentions }: EditMessage): Promise<Message> {
		const message = await this.session.rest.runMethod(
			this.session.rest,
			"POST",
			Routes.CHANNEL_MESSAGE(this.id, this.channelId),
			{
				content,
				allowed_mentions: {
					parse: allowedMentions?.parse,
					roles: allowedMentions?.roles,
					users: allowedMentions?.users,
					replied_user: allowedMentions?.repliedUser,
				},
			}
		);

		return message;
	}

	/** Responds directly in the channel the message was sent */
	async respond({ content, allowedMentions }: CreateMessage): Promise<Message> {
		const message = await this.session.rest.runMethod(
			this.session.rest,
			"POST",
			Routes.CHANNEL_MESSAGES(this.channelId),
			{
				content,
				allowed_mentions: {
					parse: allowedMentions?.parse,
					roles: allowedMentions?.roles,
					users: allowedMentions?.users,
					replied_user: allowedMentions?.repliedUser,
				},
			}
		);

		return message;
	}
}