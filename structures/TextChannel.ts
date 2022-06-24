import { GuildChannel } from "./GuildChannel.ts";
import { DiscordChannel, Session } from "../mod.ts";

export class TextChannel extends GuildChannel {
  constructor(session: Session, data: DiscordChannel) {
    super(session, data);
  }

  get lastMessageId() {
    return this.data.last_message_id;
  }
  get rateLimitPerUser() {
    return this.data.rate_limit_per_user;
  }

  get parentId() {
    return this.data.parent_id;
  }

  get permissionOverwrites() {
    return this.data.permission_overwrites;
  }

  get nsfw() {
    return this.data.nsfw;
  }
}
