import { RESTPatchAPIWebhookWithTokenMessageJSONBody, RESTPostAPIInteractionCallbackJSONBody } from "@biscuitland/common";
import type { Session } from "..";
import type { RawFile } from "@discordjs/rest";

export class InteractionManager {
  readonly session!: Session;
  constructor(session: Session) {
    Object.defineProperty(this, "session", {
      value: session,
      writable: false,
    });
  }

  reply(interactionId: string, token: string, body: RESTPostAPIInteractionCallbackJSONBody, files: RawFile[] = []) {
    return this.session.api.interactions(interactionId)(token).callback.post({
      body,
      files,
    });
  }
  getResponse(applicationId: string, token: string, messageId = "@original") {
    return this.session.api.webhooks(applicationId)(token).messages(messageId).get();
  }

  editResponse(applicationId: string, token: string, messageId: string, body: RESTPatchAPIWebhookWithTokenMessageJSONBody, files: RawFile[]) {
    return this.session.api.webhooks(applicationId)(token).messages(messageId).patch({
      body,
      files,
    })
  }
}
