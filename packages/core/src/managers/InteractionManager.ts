import type {
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPostAPIInteractionCallbackJSONBody,
  RESTPostAPIInteractionFollowupJSONBody
} from '@biscuitland/common';
import type { Session } from '..';
import type { RawFile } from '@biscuitland/rest';

export class InteractionManager {
  readonly session!: Session;
  constructor(session: Session) {
    Object.defineProperty(this, 'session', {
      value: session,
      writable: false
    });
  }

  reply<T extends RESTPostAPIInteractionCallbackJSONBody = RESTPostAPIInteractionCallbackJSONBody>(
    interactionId: string,
    token: string,
    body: T,
    files?: RawFile[]
  ) {
    return this.session.api.interactions(interactionId)(token).callback.post({
      body,
      files
    });
  }
  
  getResponse(applicationId: string, token: string, messageId = '@original') {
    return this.session.api.webhooks(applicationId)(token).messages(messageId).get();
  }

  editResponse(
    applicationId: string,
    token: string,
    messageId: string,
    body: RESTPatchAPIWebhookWithTokenMessageJSONBody,
    files?: RawFile[]
  ) {
    return this.session.api.webhooks(applicationId)(token).messages(messageId).patch({
      body,
      files
    });
  }

  deleteResponse(applicationId: string, token: string, messageId = '@original') {
    return this.session.api.webhooks(applicationId)(token).messages(messageId).delete();
  }

  followUp(applicationId: string, token: string, body: RESTPostAPIInteractionFollowupJSONBody, files?: RawFile[]) {
    return this.session.api.webhooks(applicationId)(token).post({
      body,
      files
    });
  }
}
