import type { APIPoll } from 'discord-api-types/v10';
import { toCamelCase, type ObjectToLower } from '../common';
import { Base } from './extra/Base';
import type { UsingClient } from '../commands';
import type { ValidAnswerId } from '../api/Routes/channels';

export interface Poll extends ObjectToLower<Omit<APIPoll, 'expiry'>> {}

export class Poll extends Base {
	expiry: number;
	constructor(
		client: UsingClient,
		data: APIPoll,
		readonly channelId: string,
		readonly messageId: string,
	) {
		super(client);
		this.expiry = Date.parse(data.expiry);
		Object.assign(this, toCamelCase(data));
	}
	end() {
		return this.client.messages.endPoll(this.channelId, this.messageId);
	}

	getAnswerVoters(id: ValidAnswerId) {
		if (!this.answers.find(x => x.answerId === id)) throw new Error('Invalid answer id');
		return this.client.messages.getAnswerVoters(this.channelId, this.messageId, id);
	}
}
