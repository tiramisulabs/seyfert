import {
  RESTDeleteAPIChannelAllMessageReactionsResult,
  RESTDeleteAPIChannelMessageReactionResult,
  RESTDeleteAPIChannelMessageResult,
  RESTDeleteAPIChannelPermissionResult,
  RESTDeleteAPIChannelPinResult,
  RESTDeleteAPIChannelRecipientResult,
  RESTDeleteAPIChannelResult,
  RESTDeleteAPIChannelThreadMembersResult,
  RESTGetAPIChannelInvitesResult,
  RESTGetAPIChannelMessageReactionUsersQuery,
  RESTGetAPIChannelMessageReactionUsersResult,
  RESTGetAPIChannelMessageResult,
  RESTGetAPIChannelMessagesQuery,
  RESTGetAPIChannelMessagesResult,
  RESTGetAPIChannelPinsResult,
  RESTGetAPIChannelResult,
  RESTGetAPIChannelThreadMemberQuery,
  RESTGetAPIChannelThreadMemberResult,
  RESTGetAPIChannelThreadMembersQuery,
  RESTGetAPIChannelThreadMembersResult,
  RESTGetAPIChannelThreadsArchivedPrivateResult,
  RESTGetAPIChannelThreadsArchivedPublicResult,
  RESTGetAPIChannelThreadsArchivedQuery,
  RESTGetAPIChannelUsersThreadsArchivedResult,
  RESTGetAPIGuildWebhooksResult,
  RESTPatchAPIChannelJSONBody,
  RESTPatchAPIChannelMessageJSONBody,
  RESTPatchAPIChannelMessageResult,
  RESTPatchAPIChannelResult,
  RESTPostAPIChannelFollowersJSONBody,
  RESTPostAPIChannelFollowersResult,
  RESTPostAPIChannelInviteJSONBody,
  RESTPostAPIChannelInviteResult,
  RESTPostAPIChannelMessageCrosspostResult,
  RESTPostAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessageResult,
  RESTPostAPIChannelMessagesBulkDeleteJSONBody,
  RESTPostAPIChannelMessagesBulkDeleteResult,
  RESTPostAPIChannelMessagesThreadsJSONBody,
  RESTPostAPIChannelMessagesThreadsResult,
  RESTPostAPIChannelThreadsJSONBody,
  RESTPostAPIChannelThreadsResult,
  RESTPostAPIChannelTypingResult,
  RESTPostAPIChannelWebhookJSONBody,
  RESTPostAPIChannelWebhookResult,
  RESTPostAPIGuildForumThreadsJSONBody,
  RESTPutAPIChannelMessageReactionResult,
  RESTPutAPIChannelPermissionJSONBody,
  RESTPutAPIChannelPermissionResult,
  RESTPutAPIChannelPinResult,
  RESTPutAPIChannelRecipientJSONBody,
  RESTPutAPIChannelRecipientResult,
  RESTPutAPIChannelThreadMembersResult
} from '@biscuitland/common';
import { RestArguments } from '../REST';
import { RequestMethod } from '../Router';

export interface ChannelRoutes {
  channels(id: string): {
    //.
    get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIChannelResult>;
    //.
    patch(args: RestArguments<RequestMethod.Patch, RESTPatchAPIChannelJSONBody>): Promise<RESTPatchAPIChannelResult>;
    //.
    delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelResult>;
    users: {
      (id: '@me'): {
        threads: {
          archived: {
            private: {
              //.
              get(
                args?: RestArguments<RequestMethod.Get, RESTGetAPIChannelThreadsArchivedQuery>
              ): Promise<RESTGetAPIChannelUsersThreadsArchivedResult>;
            };
          };
        };
      };
    };
    'thread-members': {
      //.
      get(args?: RestArguments<RequestMethod.Get, RESTGetAPIChannelThreadMembersQuery>): Promise<RESTGetAPIChannelThreadMembersResult>;
      (id: '@me'): {
        //.
        put(args: RestArguments<RequestMethod.Put>): Promise<RESTPutAPIChannelThreadMembersResult>;
        //.
        delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelThreadMembersResult>;
      };
      (id: string): {
        //.
        get(args?: RestArguments<RequestMethod.Get, RESTGetAPIChannelThreadMemberQuery>): Promise<RESTGetAPIChannelThreadMemberResult>;
        //.
        put(args: RestArguments<RequestMethod.Put>): Promise<RESTPutAPIChannelThreadMembersResult>;
        //.
        delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelThreadMembersResult>;
      };
    };
    threads: {
      //.
      post(
        args: RestArguments<RequestMethod.Post, RESTPostAPIChannelThreadsJSONBody | RESTPostAPIGuildForumThreadsJSONBody>
      ): Promise<RESTPostAPIChannelThreadsResult>;
      archived: {
        public: {
          //.
          get(
            args?: RestArguments<RequestMethod.Get, RESTGetAPIChannelThreadsArchivedQuery>
          ): Promise<RESTGetAPIChannelThreadsArchivedPublicResult>;
        };
        private: {
          //.
          get(
            args?: RestArguments<RequestMethod.Get, RESTGetAPIChannelThreadsArchivedQuery>
          ): Promise<RESTGetAPIChannelThreadsArchivedPrivateResult>;
        };
      };
    };
    recipients: {
      (id: string): {
        //.
        put(args: RestArguments<RequestMethod.Put, RESTPutAPIChannelRecipientJSONBody>): Promise<RESTPutAPIChannelRecipientResult>;
        //.
        delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelRecipientResult>;
      };
    };
    pins: {
      //.
      get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIChannelPinsResult>;
      (id: string): {
        //.
        put(args: RestArguments<RequestMethod.Put>): Promise<RESTPutAPIChannelPinResult>;
        //.
        delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelPinResult>;
      };
    };
    followers: {
      //.
      post(args: RestArguments<RequestMethod.Post, RESTPostAPIChannelFollowersJSONBody>): Promise<RESTPostAPIChannelFollowersResult>;
    };
    permissions: {
      (id: string): {
        //.
        put(args: RestArguments<RequestMethod.Put, RESTPutAPIChannelPermissionJSONBody>): Promise<RESTPutAPIChannelPermissionResult>;
        //.
        delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelPermissionResult>;
      };
    };
    invites: {
      //.
      get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIChannelInvitesResult>;
      //.
      post(args: RestArguments<RequestMethod.Post, RESTPostAPIChannelInviteJSONBody>): Promise<RESTPostAPIChannelInviteResult>;
    };
    messages: {
      //.
      get(args?: RestArguments<RequestMethod.Get, RESTGetAPIChannelMessagesQuery>): Promise<RESTGetAPIChannelMessagesResult>;
      //.
      post(args: RestArguments<RequestMethod.Post, RESTPostAPIChannelMessageJSONBody>): Promise<RESTPostAPIChannelMessageResult>;
      'bulk-delete': {
        //.
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPIChannelMessagesBulkDeleteJSONBody>
        ): Promise<RESTPostAPIChannelMessagesBulkDeleteResult>;
      };
      (id: string): {
        //.
        get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIChannelMessageResult>;
        //.
        patch(args: RestArguments<RequestMethod.Patch, RESTPatchAPIChannelMessageJSONBody>): Promise<RESTPatchAPIChannelMessageResult>;
        //.
        delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelMessageResult>;
        threads: {
          //.
          post(
            args: RestArguments<RequestMethod.Post, RESTPostAPIChannelMessagesThreadsJSONBody>
          ): Promise<RESTPostAPIChannelMessagesThreadsResult>;
        };
        crosspost: {
          //.
          post(args: RestArguments<RequestMethod.Post>): Promise<RESTPostAPIChannelMessageCrosspostResult>;
        };
        reactions: {
          //.
          delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelAllMessageReactionsResult>;
          (emoji: string): {
            //.
            get(
              args?: RestArguments<RequestMethod.Get, RESTGetAPIChannelMessageReactionUsersQuery>
            ): Promise<RESTGetAPIChannelMessageReactionUsersResult>;
            //.
            delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelMessageReactionResult>;
            (id: '@me'): {
              //.
              put(args: RestArguments<RequestMethod.Put>): Promise<RESTPutAPIChannelMessageReactionResult>;
              //.
              delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelMessageReactionResult>;
            };
            (id: string): {
              //.
              delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIChannelMessageReactionResult>;
            };
          };
        };
      };
    };
    typing: {
      //.
      post(args?: RestArguments<RequestMethod.Post>): Promise<RESTPostAPIChannelTypingResult>;
    };
    webhooks: {
      //.
      get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGuildWebhooksResult>;
      //.
      post(args: RestArguments<RequestMethod.Post, RESTPostAPIChannelWebhookJSONBody>): Promise<RESTPostAPIChannelWebhookResult>;
    };
  };
}
