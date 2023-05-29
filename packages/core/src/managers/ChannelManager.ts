import type {
  APIChannel,
  RESTPostAPIChannelMessageJSONBody,
  RESTPatchAPIChannelJSONBody,
  RESTGetAPIChannelThreadsArchivedQuery,
  RESTGetAPIChannelMessageReactionUsersQuery,
  RESTPatchAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessagesBulkDeleteJSONBody,
  RESTPutAPIChannelPermissionJSONBody,
  RESTPostAPIChannelInviteJSONBody,
  RESTPostAPIChannelFollowersJSONBody,
  RESTPutAPIChannelRecipientJSONBody,
  RESTPostAPIChannelMessagesThreadsJSONBody,
  RESTPostAPIChannelThreadsJSONBody,
  RESTPostAPIChannelThreadsResult,
  RESTPostAPIGuildForumThreadsJSONBody,
  RESTGetAPIChannelThreadMembersQuery,
  RESTGetAPIChannelThreadMemberQuery,
  RESTPostAPIChannelWebhookJSONBody,
  RESTPatchAPIStageInstanceJSONBody
} from '@biscuitland/common';
import type { RawFile } from '@biscuitland/rest';

import type { Session } from '../session';

export class ChannelManager {
  readonly session!: Session;
  constructor(session: Session) {
    Object.defineProperty(this, 'session', {
      value: session,
      writable: false
    });
  }

  get<T extends APIChannel = APIChannel>(id: string) {
    return this.session.api.channels(id).get() as Promise<T>;
  }

  getWebhooks(channelId: string) {
    return this.session.api.channels(channelId).webhooks.get();
  }

  createWebhook(channelId: string, body: RESTPostAPIChannelWebhookJSONBody) {
    return this.session.api.channels(channelId).webhooks.post({ body });
  }

  edit(id: string, data: RESTPatchAPIChannelJSONBody) {
    return this.session.api.channels(id).patch({ body: data });
  }

  delete(id: string) {
    return this.session.api.channels(id).delete();
  }

  getMessages(id: string, limit = 50) {
    return this.session.api.channels(id).messages.get({
      query: { limit }
    });
  }

  getMessage(id: string, messageId: string) {
    return this.session.api.channels(id).messages(messageId).get();
  }

  createMessage(id: string, data: RESTPostAPIChannelMessageJSONBody) {
    return this.session.api.channels(id).messages.post({ body: data });
  }

  sendTyping(id: string) {
    return this.session.api.channels(id).typing.post();
  }

  getArchivedThreads(channelId: string, options: RESTGetAPIChannelThreadsArchivedOptions) {
    const { type, ...query } = options;
    if (type === 'private') {
      return this.session.api.channels(channelId).threads.archived.private.get({ query });
    }

    return this.session.api.channels(channelId).threads.archived.public.get({ query });
  }

  crosspostMessage(channelId: string, messageId: string) {
    return this.session.api.channels(channelId).messages(messageId).crosspost.post({});
  }

  createReaction(channelId: string, messageId: string, emoji: string) {
    return this.session.api.channels(channelId).messages(messageId).reactions(emoji)('@me').put({});
  }

  deleteReaction(channelId: string, messageId: string, emoji: string, user = '@me') {
    return this.session.api.channels(channelId).messages(messageId).reactions(emoji)(user).delete();
  }

  getReactions(
    channelId: string,
    messageId: string,
    emoji: string,
    query?: RESTGetAPIChannelMessageReactionUsersQuery
  ) {
    return this.session.api.channels(channelId).messages(messageId).reactions(emoji).get({ query });
  }

  deleteAllReactions(channelId: string, messageId: string, emoji?: string) {
    if (emoji?.length) return this.session.api.channels(channelId).messages(messageId).reactions(emoji).delete();
    return this.session.api.channels(channelId).messages(messageId).reactions.delete();
  }

  editMessage(channelId: string, messageId: string, body: RESTPatchAPIChannelMessageJSONBody, files?: RawFile[]) {
    return this.session.api.channels(channelId).messages(messageId).patch({
      body,
      files
    });
  }

  deleteMessage(channelId: string, messageId: string, reason?: string) {
    return this.session.api.channels(channelId).messages(messageId).delete({ reason });
  }

  bulkMessages(channelId: string, body: RESTPostAPIChannelMessagesBulkDeleteJSONBody, reason?: string) {
    return this.session.api.channels(channelId).messages['bulk-delete'].post({ body, reason });
  }

  editPermissions(channelId: string, overwriteId: string, body: RESTPutAPIChannelPermissionJSONBody, reason?: string) {
    return this.session.api.channels(channelId).permissions(overwriteId).put({ body, reason });
  }

  deletePermission(channelId: string, overwriteId: string, reason?: string) {
    return this.session.api.channels(channelId).permissions(overwriteId).delete({ reason });
  }

  getInvites(channelId: string) {
    return this.session.api.channels(channelId).invites.get();
  }

  createInvite(channelId: string, body: RESTPostAPIChannelInviteJSONBody) {
    return this.session.api.channels(channelId).invites.post({ body });
  }

  followAnnoucement(channelId: string, body: RESTPostAPIChannelFollowersJSONBody) {
    return this.session.api.channels(channelId).followers.post({ body });
  }

  getPinnedMessages(channelId: string) {
    return this.session.api.channels(channelId).pins.get();
  }

  pinMessage(channelId: string, messageId: string, reason?: string) {
    return this.session.api.channels(channelId).pins(messageId).put({ reason });
  }

  unpinMessage(channelId: string, messageId: string, reason?: string) {
    return this.session.api.channels(channelId).pins(messageId).delete({ reason });
  }

  groupDMAddRecipient(channelId: string, userId: string, body: RESTPutAPIChannelRecipientJSONBody) {
    return this.session.api.channels(channelId).recipients(userId).put({ body });
  }

  groupDMRemoveRecipient(channelId: string, userId: string) {
    return this.session.api.channels(channelId).recipients(userId).delete();
  }

  startThreadFromMessage(
    channelId: string,
    messageId: string,
    body: RESTPostAPIChannelMessagesThreadsJSONBody,
    reason?: string
  ) {
    return this.session.api.channels(channelId).messages(messageId).threads.post({ body, reason });
  }

  startThread(
    channelId: string,
    body: RESTPostAPIChannelThreadsJSONBody,
    reason?: string
  ): Promise<RESTPostAPIChannelThreadsResult>;
  startThread(channelId: string, body: RESTPostAPIGuildForumThreadsJSONBody, reason?: string) {
    return this.session.api.channels(channelId).threads.post({ body, reason });
  }

  getListJoinedPrivateArchivedThreads(channelId: string, query?: RESTGetAPIChannelThreadsArchivedQuery) {
    return this.session.api.channels(channelId).users('@me').threads.archived.private.get({ query });
  }

  getThreadMembers(channelId: string, query?: RESTGetAPIChannelThreadMembersQuery) {
    return this.session.api.channels(channelId)['thread-members'].get({ query });
  }

  getThreadMember(channelId: string, userId: string, query?: RESTGetAPIChannelThreadMemberQuery) {
    return this.session.api.channels(channelId)['thread-members'](userId).get({ query });
  }

  addThreadMember(channelId: string, userId: string) {
    return this.session.api.channels(channelId)['thread-members'](userId).put({});
  }

  removeThreadMember(channelId: string, userId: string) {
    return this.session.api.channels(channelId)['thread-members'](userId).delete();
  }

  leaveThread(channelId: string) {
    return this.session.api.channels(channelId)['thread-members']('@me').delete();
  }

  joinThread(channelId: string) {
    return this.session.api.channels(channelId)['thread-members']('@me').put({});
  }

  getVoiceRegions() {
    return this.session.api.voice.region.get();
  }

  getStageInstance(channelId: string) {
    return this.session.api['stage-instances'](channelId).get();
  }

  editStageInstance(channelId: string, body: RESTPatchAPIStageInstanceJSONBody, reason?: string) {
    return this.session.api['stage-instances'](channelId).patch({ body, reason })
  }

  deleteStageInstance(channelId: string, reason?: string) {
    return this.session.api['stage-instances'](channelId).delete({ reason });
  }
}

export type RESTGetAPIChannelThreadsArchivedOptions = {
  type: 'private' | 'public';
} & RESTGetAPIChannelThreadsArchivedQuery;
