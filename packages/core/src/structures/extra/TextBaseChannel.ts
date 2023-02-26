import {
	APIChannel,
	APIDMChannel,
	APIGroupDMChannel,
	APIGuildTextChannel,
	GuildTextChannelType,
} from "discord-api-types/v10";
import { Session } from "../../session";
import { BaseChannel } from "./BaseChannel";

export class TextBaseChannel extends BaseChannel {
	constructor(session: Session, data: APIGuildTextChannel<GuildTextChannelType> | APIDMChannel | APIGroupDMChannel) {
		super(session, data as APIChannel);
		this.id = data.id;
	}

	override id: string;
}
