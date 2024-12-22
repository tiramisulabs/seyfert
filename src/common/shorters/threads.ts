import type { ThreadChannelStructure } from '../../client/transformers';
import { channelFrom } from '../../structures';
import type {
	APIThreadChannel,
	APIThreadMember,
	RESTGetAPIChannelThreadMembersQuery,
	RESTGetAPIChannelThreadsArchivedQuery,
	RESTPatchAPIChannelJSONBody,
	RESTPostAPIChannelMessagesThreadsJSONBody,
	RESTPostAPIChannelThreadsJSONBody,
	RESTPostAPIGuildForumThreadsJSONBody,
} from '../../types';
import type { MakeRequired, When } from '../types/util';
import { BaseShorter } from './base';

export class ThreadShorter extends BaseShorter {
	/**
	 * Creates a new thread in the channel (only guild based channels).
	 * @param channelId The ID of the parent channel.
	 * @param reason The reason for unpinning the message.
	 * @returns A promise that resolves when the thread is succesfully created.
	 */
	create(
		channelId: string,
		body: RESTPostAPIChannelThreadsJSONBody | RESTPostAPIGuildForumThreadsJSONBody,
		reason?: string,
	): Promise<ThreadChannelStructure> {
		return (
			this.client.proxy
				.channels(channelId)
				.threads.post({ body, reason })
				// When testing this, discord returns the thread object, but in discord api types it does not.
				.then(async thread => {
					await this.client.cache.channels?.setIfNI(
						'Guilds',
						thread.id,
						(thread as APIThreadChannel).guild_id!,
						thread,
					);
					return channelFrom(thread, this.client) as ThreadChannelStructure;
				})
		);
	}

	fromMessage(
		channelId: string,
		messageId: string,
		options: RESTPostAPIChannelMessagesThreadsJSONBody & { reason?: string },
	): Promise<ThreadChannelStructure> {
		const { reason, ...body } = options;

		return this.client.proxy
			.channels(channelId)
			.messages(messageId)
			.threads.post({ body, reason })
			.then(async thread => {
				await this.client.cache.channels?.setIfNI('Guilds', thread.id, (thread as APIThreadChannel).guild_id!, thread);
				return channelFrom(thread, this.client) as ThreadChannelStructure;
			});
	}

	join(threadId: string) {
		return this.client.proxy.channels(threadId)['thread-members']('@me').put();
	}

	leave(threadId: string) {
		return this.client.proxy.channels(threadId)['thread-members']('@me').delete();
	}

	lock(threadId: string, locked = true, reason?: string): Promise<ThreadChannelStructure> {
		return this.edit(threadId, { locked }, reason).then(x => channelFrom(x, this.client) as ThreadChannelStructure);
	}

	async edit(threadId: string, body: RESTPatchAPIChannelJSONBody, reason?: string): Promise<ThreadChannelStructure> {
		return (await this.client.channels.edit(threadId, body, { reason })) as ThreadChannelStructure;
	}

	removeMember(threadId: string, memberId: string) {
		return this.client.proxy.channels(threadId)['thread-members'](memberId).delete();
	}

	fetchMember<WithMember extends boolean = false>(
		threadId: string,
		memberId: string,
		with_member: WithMember,
	): Promise<When<WithMember, Required<APIThreadMember>, GetAPIChannelThreadMemberResult>> {
		return this.client.proxy.channels(threadId)['thread-members'](memberId).get({
			query: {
				with_member,
			},
		}) as never;
	}

	addMember(threadId: string, memberId: string) {
		return this.client.proxy.channels(threadId)['thread-members'](memberId).put();
	}

	listMembers<T extends RESTGetAPIChannelThreadMembersQuery = RESTGetAPIChannelThreadMembersQuery>(
		threadId: string,
		query?: T,
	): Promise<InferWithMemberOnList<T>> {
		return this.client.proxy.channels(threadId)['thread-members'].get({ query }) as never;
	}

	async listArchivedThreads(
		channelId: string,
		type: 'public' | 'private',
		query?: RESTGetAPIChannelThreadsArchivedQuery,
	): Promise<{
		threads: ThreadChannelStructure[];
		members: GetAPIChannelThreadMemberResult[];
		hasMore: boolean;
	}> {
		const data = await this.client.proxy.channels(channelId).threads.archived[type].get({ query });

		return {
			threads: data.threads.map(thread => channelFrom(thread, this.client) as ThreadChannelStructure),
			members: data.members as GetAPIChannelThreadMemberResult[],
			hasMore: data.has_more,
		};
	}

	async listJoinedArchivedPrivate(
		channelId: string,
		query?: RESTGetAPIChannelThreadsArchivedQuery,
	): Promise<{
		threads: ThreadChannelStructure[];
		members: GetAPIChannelThreadMemberResult[];
		hasMore: boolean;
	}> {
		const data = await this.client.proxy.channels(channelId).users('@me').threads.archived.private.get({ query });
		return {
			threads: data.threads.map(thread => channelFrom(thread, this.client) as ThreadChannelStructure),
			members: data.members as GetAPIChannelThreadMemberResult[],
			hasMore: data.has_more,
		};
	}
}

export type GetAPIChannelThreadMemberResult = MakeRequired<APIThreadMember, 'id' | 'user_id'>;

type InferWithMemberOnList<T extends RESTGetAPIChannelThreadMembersQuery> = T extends {
	with_member: infer B;
}
	? B extends true
		? Required<APIThreadMember>[]
		: GetAPIChannelThreadMemberResult[]
	: GetAPIChannelThreadMemberResult[];
