import type { RESTPostAPIChannelInviteJSONBody } from '../../types';
import { toCamelCase } from '../it/utils';
import { BaseShorter } from './base';

export class InvitesShorter extends BaseShorter {
	get(code: string) {
		return this.client.proxy
			.invites(code)
			.get()
			.then(x => toCamelCase(x));
	}

	delete(code: string, reason?: string) {
		return this.client.proxy
			.invites(code)
			.delete({ reason })
			.then(x => toCamelCase(x));
	}

	/**
	 * Returns a list of users that can accept this invite.
	 * @param code  The invite code.
	 * @returns The csv file as a string, with a single header user_id.
	 */
	getTargetUsers(code: string) {
		return this.client.proxy.invites(code)['target-users'].get();
	}

	updateTargetUsers(code: string, targetIds: string[]) {
		return this.client.proxy.invites(code)['target-users'].put({
			body: {
				target_users_file: new Blob([`users\n${targetIds.join('\n')}`], { type: 'text/csv' }),
			},
			appendToFormData: true,
		});
	}

	jobStatus(code: string) {
		return this.client.proxy
			.invites(code)
			['target-users']['job-status'].get()
			.then(x => toCamelCase(x));
	}

	channels = {
		create: ({ channelId, reason, ...body }: CreateInviteFromChannel) =>
			this.client.proxy
				.channels(channelId)
				.invites.post({ body, reason })
				.then(x => toCamelCase(x)),
		list: (channelId: string) =>
			this.client.proxy
				.channels(channelId)
				.invites.get()
				.then(x => toCamelCase(x)),
	};

	guilds = {
		list: (guildId: string) =>
			this.client.proxy
				.guilds(guildId)
				.invites.get()
				.then(x => toCamelCase(x)),
	};
}

export interface CreateInviteFromChannel extends RESTPostAPIChannelInviteJSONBody {
	channelId: string;
	reason?: string;
}
