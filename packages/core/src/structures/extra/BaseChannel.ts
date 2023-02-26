import { APIChannel, ChannelFlags, ChannelType } from "discord-api-types/v10";
import { BiscuitChannels, Session, ThreadTypes } from "../../index";
import { channelFactory } from "../../utils/utils";
import { Base } from "./Base";

export class BaseChannel extends Base {
	constructor(session: Session, data: APIChannel) {
		super(session, data.id);
		this.id = data.id;
		this.type = data.type;
		this.flags = data.flags;
	}

	override id: string;

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

		return channelFactory(this.session, channel);
	}

	isThread() {
		return Boolean(ThreadTypes[this.type]);
	}

	isDMBased() {
		return [ChannelType.DM, ChannelType.GroupDM].includes(this.type);
	}

	isTextBased() {
		return "messages" in this;
	}

	isVoiceBased() {
		return "bitrate" in this;
	}

	toString() {
		return `<#${this.id}>`;
	}
}
