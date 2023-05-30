import {
  Identify,
  RESTPatchAPIWebhookJSONBody,
  RESTPatchAPIWebhookResult,
  RESTPatchAPIWebhookWithTokenJSONBody,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPatchAPIWebhookWithTokenResult,
  RESTPostAPIChannelWebhookJSONBody,
  RESTPostAPIWebhookWithTokenGitHubQuery,
  RESTPostAPIWebhookWithTokenGitHubWaitResult,
  RESTPostAPIWebhookWithTokenJSONBody,
  RESTPostAPIWebhookWithTokenQuery,
  RESTPostAPIWebhookWithTokenSlackQuery,
  RESTPostAPIWebhookWithTokenSlackWaitResult,
  RESTPostAPIWebhookWithTokenWaitResult
} from '@biscuitland/common';
import type { Session } from '..';

export class WebhookManager {
  readonly session!: Session;
  constructor(session: Session) {
    Object.defineProperty(this, 'session', {
      value: session,
      writable: false
    });
  }

  create(channelId: string, body: RESTPostAPIChannelWebhookJSONBody) {
    return this.session.api.channels(channelId).webhooks.post({ body });
  }

  getChannelWebhooks(channelId: string) {
    return this.session.api.channels(channelId).webhooks.get();
  }

  getGuildWebhooks(guildId: string) {
    return this.session.api.guilds(guildId).webhooks.get();
  }

  get(webhookdId: string, token?: string) {
    if (!token?.length) return this.session.api.webhooks(webhookdId).get();
    return this.session.api.webhooks(webhookdId)(token).get();
  }

  edit(webhookId: string, body: RESTPatchAPIWebhookJSONBody): Promise<RESTPatchAPIWebhookResult>;
  edit(webhookId: string, body: RESTPatchAPIWebhookWithTokenJSONBody, token: string): Promise<RESTPatchAPIWebhookWithTokenResult>;
  edit(webhookId: string, body: RESTPatchAPIWebhookJSONBody, token?: string) {
    if (!token?.length) {
      return this.session.api.webhooks(webhookId).patch({ body });
    }
    return this.session.api.webhooks(webhookId)(token).patch({ body });
  }

  delete(webhookdId: string, token?: string) {
    if (!token?.length) return this.session.api.webhooks(webhookdId).delete();
    return this.session.api.webhooks(webhookdId)(token).delete();
  }

  execute(
    webhookId: string,
    token: string,
    body: RESTPostAPIWebhookWithTokenJSONBody,
    query: RESTPostAPIWebhookWithTokenWaitQuery
  ): Promise<RESTPostAPIWebhookWithTokenWaitResult>;
  execute(webhookId: string, token: string, body: RESTPostAPIWebhookWithTokenJSONBody, query?: RESTPostAPIWebhookWithTokenQuery) {
    return this.session.api.webhooks(webhookId)(token).post({
      body,
      query
    });
  }

  executeGithub(
    webhookId: string,
    token: string,
    body: RESTPostAPIWebhookWithTokenJSONBody,
    query: Identify<RESTPostAPIWebhookWithTokenGitHubQuery & { wait: true }>
  ): Promise<RESTPostAPIWebhookWithTokenGitHubWaitResult>;
  executeGithub(
    webhookId: string,
    token: string,
    body: RESTPostAPIWebhookWithTokenJSONBody,
    query?: RESTPostAPIWebhookWithTokenGitHubQuery
  ) {
    return this.session.api.webhooks(webhookId)(token).github.post({
      body,
      query
    });
  }

  executeSlack(
    webhookId: string,
    token: string,
    body: RESTPostAPIWebhookWithTokenJSONBody,
    query: Identify<RESTPostAPIWebhookWithTokenSlackQuery & { wait: true }>
  ): Promise<RESTPostAPIWebhookWithTokenSlackWaitResult>;
  executeSlack(webhookId: string, token: string, body: RESTPostAPIWebhookWithTokenJSONBody, query?: RESTPostAPIWebhookWithTokenSlackQuery) {
    return this.session.api.webhooks(webhookId)(token).slack.post({
      body,
      query
    });
  }

  getMessage(webhookId: string, token: string, messageId: string, query?: { thread_id?: string }) {
    return this.session.api.webhooks(webhookId)(token).messages(messageId).get({
      query
    });
  }

  editMessage(
    webhookId: string,
    token: string,
    messageId: string,
    body: RESTPatchAPIWebhookWithTokenMessageJSONBody,
    query?: { thread_id?: string }
  ) {
    return this.session.api.webhooks(webhookId)(token).messages(messageId).patch({ query, body });
  }

  deleteMessage(webhookId: string, token: string, messageId: string, query?: { thread_id?: string }) {
    return this.session.api.webhooks(webhookId)(token).messages(messageId).delete({ query });
  }
}

export type RESTPostAPIWebhookWithTokenWaitQuery = Identify<RESTPostAPIWebhookWithTokenQuery & { wait: true }>;
