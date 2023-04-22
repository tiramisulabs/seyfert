import { APIChannel, ChannelFlags, ChannelType } from '@biscuitland/common';
import { BiscuitChannels, Session, channelFactory, channelLink } from '../../index';
import { DiscordBase } from './DiscordBase';

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
		return channelLink(this.id);
	}

	async fetch(): Promise<BiscuitChannels> {
		const channel = await this.session.managers.channels.fetch(this.id);

		return channelFactory(this.session, channel);
	}

	toString() {
		return `<#${this.id}>`;
	}
}
