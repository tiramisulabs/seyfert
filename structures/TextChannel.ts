import { GuildChannel } from "./GuildChannel.ts";
import { Guild } from "./Guild.ts";
import { ThreadChannel } from "./ThreadChannel.ts";
import { Message } from "./Message.ts";
import {
  DiscordChannel,
  DiscordInviteCreate,
  Routes,
  Session,
  Snowflake,
  DiscordMessage
} from "../mod.ts";
import { GetMessagesOptions  } from "../util/Routes.ts"

export interface DiscordInvite {
  max_age?: number;
  max_uses?: number;
  unique?: boolean;
  temporary: boolean;
  reason?: string;
}

export interface ThreadCreateOptions {
  name: string;
  autoArchiveDuration: 60 | 1440 | 4320 | 10080;
  type: 10 | 11 | 12;
  invitable?: boolean;
  reason?: string;
}

export class TextChannel extends GuildChannel {
  constructor(session: Session, data: DiscordChannel, guild: Guild) {
    super(session, data, guild);
    data.last_message_id ? this.lastMessageId = data.last_message_id : undefined;
    data.last_pin_timestamp ? this.lastPinTimestamp =  data.last_pin_timestamp : undefined;
    this.rateLimitPerUser = data.rate_limit_per_user ?? 0;
    this.nsfw = !!data.nsfw ?? false;
  }

  lastMessageId?: Snowflake;
  lastPinTimestamp?: string;
  rateLimitPerUser: number;
  nsfw: boolean;

  async fetchPins(): Promise<Message[] | undefined> {
    const messages = await this.session.rest.runMethod(
      this.session.rest,
      "GET",
      Routes.CHANNEL_PINS(this.id),
    );
    return messages[0] ? messages.map((x: DiscordMessage) => new Message(this.session, x)) : undefined;
  }

  createInvite(options?: DiscordInvite) {
    return this.session.rest.runMethod<DiscordInviteCreate>(
      this.session.rest,
      "POST",
      Routes.CHANNEL_INVITES(this.id),
      options,
    );
  }

  createThread(options: ThreadCreateOptions) {
    this.session.rest.runMethod<ThreadChannel>(
      this.session.rest,
      "POST",
      Routes.CHANNEL_CREATE_THREAD(this.id),
      options,
    );
  }

  fetchMessages(options?: GetMessagesOptions) {
    if (options?.limit! > 100) throw Error("Values must be between 0-100")
    return this.session.rest.runMethod<Message[]>(
      this.session.rest,
      "GET",
      Routes.CHANNEL_MESSAGES(this.id, options)
    )
  }

  sendTyping() {
    this.session.rest.runMethod<undefined>(
      this.session.rest,
      "POST",
      Routes.CHANNEL_TYPING(this.id),
    );
  }
}
