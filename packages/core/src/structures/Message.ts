import type {
	APIGuildMember,
	APIMessage,
	APIUser,
	GatewayMessageCreateDispatchData,
	GatewayMessageUpdateDispatchData,
	MessageFlags,
	MessageType,
} from "discord-api-types/v10";
import type { Session } from "../session";
import { Base } from "./extra/Base";
import { GuildMember } from "./GuildMember";
import { User } from "./User";

export type MessageData = APIMessage | GatewayMessageCreateDispatchData | GatewayMessageUpdateDispatchData;

export class Message extends Base {
	constructor(session: Session, data: MessageData) {
		super(session, data.id);
		this.id = data.id;
		this.channelId = data.channel_id;
		this.mentions = {
			roles: data.mention_roles ?? [],
			channels: data.mention_channels ?? [],
		};
		this.pinned = !!data.pinned;
		this.tts = !!data.tts;
		this.mentionEveryone = !!data.mention_everyone;

		this.patch(data);
	}

	override id: string;

	/** type of message */
	type?: MessageType;

	/** id of the channel the message was sent in */
	channelId: string;

	/** id of the guild the message was sent in, this should exist on MESSAGE_CREATE and MESSAGE_UPDATE events */
	guildId?: string;

	/** if the message is an Interaction or application-owned webhook, this is the id of the application */
	applicationId?: string;

	/** mentions if any */
	mentions: MessageMention;

	/** sent if the message is a response to an Interaction */
	interaction?: any;

	/** the author of this message, this field is **not** sent on webhook messages */
	author?: User;

	/** message flags combined as a bitfield */
	flags?: MessageFlags;

	/** whether this message is pinned */
	pinned: boolean;

	/** whether this was a TTS message */
	tts: boolean;

	/** contents of the message */
	content?: string;

	/** used for validating a message was sent */
	nonce?: string | number;

	/** whether this message mentions everyone */
	mentionEveryone: boolean;

	/** when this message was sent */
	timestamp?: number;

	/** when this message was edited */
	editedTimestamp?: number;

	private patch(data: MessageData) {
		if ("type" in data) {
			this.type = data.type;
		}

		if ("guild_id" in data) {
			this.guildId = data.guild_id;
		}

		if ("timestamp" in data && data.timestamp) {
			this.timestamp = Date.parse(data.timestamp);
		}

		if ("application_id" in data) {
			this.applicationId = data.application_id;
		}

		if ("author" in data && data.author) {
			this.author = new User(this.session, data.author);
		}

		if (data.mentions.length) {
			this.mentions.users = this.guildId
				? data.mentions.map(
						(m) =>
							new GuildMember(
								this.session,
								{
									...(m as APIUser & { member?: Omit<APIGuildMember, "user"> }).member!,
									user: m,
								},
								this.guildId!,
							),
				  )
				: data.mentions.map((u) => new User(this.session, u));
		}
	}
}

export type MessageMention = {
	users?: (GuildMember | User)[];
	roles: string[];
	channels: any[];
};
