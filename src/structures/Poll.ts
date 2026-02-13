import type { ValidAnswerId } from '../api/Routes/channels';
import type { MessageStructure, UserStructure } from '../client/transformers';
import type { UsingClient } from '../commands';
import { type ObjectToLower, SeyfertError, toCamelCase } from '../common';
import type { APIPoll } from '../types';
import { Base } from './extra/Base';

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

	end(): Promise<MessageStructure> {
		return this.client.messages.endPoll(this.channelId, this.messageId);
	}

	/**
	 * @param id - The ID of the answer whose voters need to be fetched.
	 * @param checkAnswer - A flag that determines if the answer ID should be validated before fetching voters.
	 *                        Default is `false`. If `true`, the method checks if the answer ID exists in the list
	 *                        of answers and throws an error if not.
	 */
	async getAnswerVoters(id: ValidAnswerId, checkAnswer = false): Promise<UserStructure[]> {
		if (checkAnswer && !this.answers.find(answer => answer.answerId === id)) {
			throw new SeyfertError('Invalid answer id');
		}
		return this.client.messages.getAnswerVoters(this.channelId, this.messageId, id);
	}
}
