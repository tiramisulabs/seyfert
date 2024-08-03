import type { APIPoll } from '../types';
import { toCamelCase, type ObjectToLower } from '../common';
import { Base } from './extra/Base';
import type { UsingClient } from '../commands';
import type { ValidAnswerId } from '../api/Routes/channels';

export interface Poll extends ObjectToLower<APIPoll> {}

export class Poll extends Base {
	constructor(
		client: UsingClient,
		data: APIPoll,
		readonly channelId: string,
		readonly messageId: string,
	) {
		super(client);
		Object.assign(this, toCamelCase(data));
	}

	get expiryTimestamp() {
		return Date.parse(this.expiry);
	}

	get expiryAt() {
		return new Date(this.expiry);
	}

	end() {
		return this.client.messages.endPoll(this.channelId, this.messageId);
	}

	getAnswerVoters(id: ValidAnswerId) {
		if (!this.answers.find(x => x.answerId === id)) throw new Error('Invalid answer id');
		return this.client.messages.getAnswerVoters(this.channelId, this.messageId, id);
	}
}
