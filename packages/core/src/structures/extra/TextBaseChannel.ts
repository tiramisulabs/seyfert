import {
	APIChannel,
	APIDMChannel,
	APIGroupDMChannel,
	APIGuildTextChannel,
	GuildTextChannelType
} from '@biscuitland/common';
import { Session } from '../../session';
import { BaseChannel } from './BaseChannel';

export class TextBaseChannel extends BaseChannel {
	constructor(session: Session, data: APIGuildTextChannel<GuildTextChannelType> | APIDMChannel | APIGroupDMChannel) {
		super(session, data as APIChannel);
	}

	async sendTyping() {
		await this.session.managers.channels.sendTyping(this.id);
	}

	fetchWebhoks() {
		return this.session.managers.channels.fetchWebhooks(this.id);
	}
}
