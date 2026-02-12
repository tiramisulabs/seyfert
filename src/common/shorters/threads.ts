import { CacheFrom, resolveFiles } from '../..';
import type { ThreadChannelStructure } from '../../client/transformers';
import { channelFrom, MessagesMethods } from '../../structures';
import {
	type APIChannel,
	type APIThreadChannel,
	type APIThreadMember,
	ChannelType,
	type RESTGetAPIChannelThreadMembersQuery,
	type RESTGetAPIChannelThreadsArchivedQuery,
	type RESTPatchAPIChannelJSONBody,
	type RESTPostAPIChannelMessagesThreadsJSONBody,
	type RESTPostAPIGuildForumThreadsJSONBody,
} from '../../types';
import type { MakeRequired, When } from '../types/util';
import type { ThreadCreateBodyRequest } from '../types/write';
import { BaseShorter } from './base';

export class ThreadShorter extends BaseShorter {
	/**
	 * Creates a new thread in the channel (only guild based channels).
	 * @param channelId The ID of the parent channel.
	 * @param reason The reason for unpinning the message.
	 * @returns A promise that resolves when the thread is succesfully created.
	 */
	async create(channelId: string, body: ThreadCreateBodyRequest, reason?: string): Promise<ThreadChannelStructure> {
		let thread: APIChannel;
		if ('message' in body) {
			const { message, files, ...rest } = body;
			const parsedFiles = files ? await resolveFiles(files) : undefined;

			const transformedBody = MessagesMethods.transformMessageBody<RESTPostAPIGuildForumThreadsJSONBody['message']>(
				body,
				parsedFiles,
				this.client,
			);

			thread = await this.client.proxy.channels(channelId).threads.post({
				body: {
					...rest,
					message: transformedBody,
				},
				files: parsedFiles,
				reason,
			});
		} else {
			thread = await this.client.proxy.channels(channelId).threads.post({ body, reason });
		}
		// When testing this, discord returns the thread object, but in discord api types it does not.
		await this.client.cache.channels?.setIfNI(
			CacheFrom.Rest,
			'Guilds',
			thread.id,
			(thread as APIThreadChannel).guild_id!,
			thread,
		);

		return channelFrom(thread, this.client) as ThreadChannelStructure;
	}

	async fromMessage(
		channelId: string,
		messageId: string,
		options: RESTPostAPIChannelMessagesThreadsJSONBody & { reason?: string },
	): Promise<ThreadChannelStructure> {
		const { reason, ...body } = options;

		const thread = await this.client.proxy.channels(channelId).messages(messageId).threads.post({ body, reason });
		await this.client.cache.channels?.setIfNI(
			CacheFrom.Rest,
			'Guilds',
			thread.id,
			(thread as APIThreadChannel).guild_id!,
			thread,
		);
		return await (channelFrom(thread, this.client) as ThreadChannelStructure);
	}

	join(threadId: string) {
		return this.client.proxy.channels(threadId)['thread-members']('@me').put();
	}

	leave(threadId: string) {
		return this.client.proxy.channels(threadId)['thread-members']('@me').delete();
	}

	async lock(threadId: string, locked = true, reason?: string): Promise<ThreadChannelStructure> {
		return this.edit(threadId, { locked }, reason);
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

	async listArchived(
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

	async listGuildActive(guildId: string, force = false): Promise<ThreadChannelStructure[]> {
		if (!force) {
			const cached = await this.client.cache.channels?.valuesRaw(guildId);
			if (cached)
				return cached
					.filter(x =>
						[ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread].includes(x.type),
					)
					.map(x => channelFrom(x, this.client) as ThreadChannelStructure);
		}
		const data = await this.client.proxy.guilds(guildId).threads.active.get();
		return Promise.all(
			data.threads.map(async thread => {
				await this.client.cache.channels?.setIfNI(CacheFrom.Rest, 'Guilds', thread.id, guildId, thread);
				return channelFrom(thread, this.client) as ThreadChannelStructure;
			}),
		);
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
