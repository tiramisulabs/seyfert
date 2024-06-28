import type { APIThreadMember, RESTGetAPIChannelThreadMembersQuery, RESTGetAPIChannelThreadsArchivedQuery, RESTPatchAPIChannelJSONBody, RESTPostAPIChannelMessagesThreadsJSONBody, RESTPostAPIChannelThreadsJSONBody, RESTPostAPIGuildForumThreadsJSONBody } from 'discord-api-types/v10';
import { BaseShorter } from './base';
import type { MakeRequired, When } from '../types/util';
export declare class ThreadShorter extends BaseShorter {
    /**
     * Creates a new thread in the channel (only guild based channels).
     * @param channelId The ID of the parent channel.
     * @param reason The reason for unpinning the message.
     * @returns A promise that resolves when the thread is succesfully created.
     */
    create(channelId: string, body: RESTPostAPIChannelThreadsJSONBody | RESTPostAPIGuildForumThreadsJSONBody, reason?: string): Promise<import("../../structures/channels").ThreadChannel>;
    fromMessage(channelId: string, messageId: string, options: RESTPostAPIChannelMessagesThreadsJSONBody & {
        reason?: string;
    }): Promise<import("../../structures/channels").ThreadChannel>;
    join(threadId: string): Promise<never>;
    leave(threadId: string): Promise<never>;
    lock(threadId: string, locked?: boolean, reason?: string): Promise<import("../../structures/channels").ThreadChannel>;
    edit(threadId: string, body: RESTPatchAPIChannelJSONBody, reason?: string): Promise<import("../../structures/channels").AllChannels>;
    removeMember(threadId: string, memberId: string): Promise<never>;
    fetchMember<WithMember extends boolean = false>(threadId: string, memberId: string, with_member: WithMember): Promise<When<WithMember, Required<APIThreadMember>, GetAPIChannelThreadMemberResult>>;
    addMember(threadId: string, memberId: string): Promise<never>;
    listMembers<T extends RESTGetAPIChannelThreadMembersQuery = RESTGetAPIChannelThreadMembersQuery>(threadId: string, query?: T): Promise<InferWithMemberOnList<T>>;
    listArchivedThreads(channelId: string, type: 'public' | 'private', query?: RESTGetAPIChannelThreadsArchivedQuery): Promise<{
        threads: import("../../structures/channels").ThreadChannel[];
        members: GetAPIChannelThreadMemberResult[];
        hasMore: boolean;
    }>;
    listJoinedArchivedPrivate(channelId: string, query?: RESTGetAPIChannelThreadsArchivedQuery): Promise<{
        threads: import("../../structures/channels").ThreadChannel[];
        members: GetAPIChannelThreadMemberResult[];
        hasMore: boolean;
    }>;
}
export type GetAPIChannelThreadMemberResult = MakeRequired<APIThreadMember, 'id' | 'user_id'>;
type InferWithMemberOnList<T extends RESTGetAPIChannelThreadMembersQuery> = T extends {
    with_member: infer B;
} ? B extends true ? Required<APIThreadMember>[] : GetAPIChannelThreadMemberResult[] : GetAPIChannelThreadMemberResult[];
export {};
