import { APIChannel, ChannelFlags, ChannelType } from "discord-api-types/v10";
import { BiscuitChannels, Session } from "../../index";
import { DiscordBase } from "./DiscordBase";

export class BaseChannel extends DiscordBase {
	constructor(session: Session, data: APIChannel) {
		super(session, data.id);
		this.type = data.type;
		this.flags = data.flags;
	}

	/** The type of channel */
	type: ChannelType;

	/** channel flags combined as a bitfield */
	flags?: ChannelFlags;

	/** The URL to the channel */
	get url() {
		return this.session.utils.channelLink(this.id);
	}

	async fetch(): Promise<BiscuitChannels> {
		const channel = await this.session.managers.channels.fetch(this.id);

		return this.session.utils.channelFactory(this.session, channel);
	}

	toString() {
		return `<#${this.id}>`;
	}
}
