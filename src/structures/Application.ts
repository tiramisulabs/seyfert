import type { UsingClient } from '..';
import type { ApplicationEmojiResolvable, ObjectToLower } from '../common';
import type {
	APIApplication,
	RESTPatchAPIApplicationEmojiJSONBody,
	RESTPatchCurrentApplicationJSONBody,
} from '../types';
import { DiscordBase } from './extra/DiscordBase';

export interface Application extends ObjectToLower<APIApplication> {}

/**
 * Due to current limitations, this is exclusively for the current application.
 */
export class Application extends DiscordBase<APIApplication> {
	constructor(client: UsingClient, data: APIApplication) {
		// override any id for safety
		data.id = client.applicationId;
		super(client, data);
	}
	/**
	 * Fetch the current application.
	 */
	fetch() {
		return this.client.applications.fetch();
	}

	/**
	 * Edit the current application.
	 */
	edit(data: RESTPatchCurrentApplicationJSONBody) {
		return this.client.applications.edit(data);
	}

	/**
	 * Get an activity instance.
	 */
	getActivityInstance(instanceId: string) {
		return this.client.applications.getActivityInstance(instanceId);
	}

	emojis = {
		/**
		 * Get an application emoji.
		 */
		fetch: (id: string) => this.client.applications.getEmoji(id),
		/**
		 * Get the application emojis.
		 */
		list: () => this.client.applications.listEmojis(),
		/**
		 * Create an application emoji.
		 */
		create: (data: ApplicationEmojiResolvable) => this.client.applications.createEmoji(data),
		/**
		 * Edit an application emoji.
		 */
		edit: (emojiId: string, body: RESTPatchAPIApplicationEmojiJSONBody) =>
			this.client.applications.editEmoji(emojiId, body),
	};
}
