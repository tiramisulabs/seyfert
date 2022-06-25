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

/**
 * Represents the options object to create an invitation
 *  https://discord.com/developers/docs/resources/channel#create-channel-invite-json-params
 */

export interface DiscordInvite {
  max_age?: number;
  max_uses?: number;
  unique?: boolean;
  temporary: boolean;
  reason?: string;
}

/**
 * Represent the options object to create a Thread Channel
 * https://discord.com/developers/docs/resources/channel#start-thread-without-message
 */

export interface ThreadCreateOptions {
  name: string;
  autoArchiveDuration: 60 | 1440 | 4320 | 10080;
  type: 10 | 11 | 12;
  invitable?: boolean;
  reason?: string;
}

export class TextChannel extends GuildChannel {
  constructor(session: Session, data: DiscordChannel, guildId: Guild["id"]) {
    super(session, data, guildId);
    data.last_message_id ? this.lastMessageId = data.last_message_id : undefined;
    data.last_pin_timestamp ? this.lastPinTimestamp =  data.last_pin_timestamp : undefined;
    this.rateLimitPerUser = data.rate_limit_per_user ?? 0;
    this.nsfw = !!data.nsfw ?? false;
  }

  lastMessageId?: Snowflake;
  lastPinTimestamp?: string;
  rateLimitPerUser: number;
  nsfw: boolean;

  async fetchPins(): Promise<Message[] | []> {
    const messages = await this.session.rest.runMethod<DiscordMessage[]>(
      this.session.rest,
      "GET",
      Routes.CHANNEL_PINS(this.id),
    );
    return messages[0] ? messages.map((x: DiscordMessage) => new Message(this.session, x)) : [];
  }
  // TODO return Invite Class
  createInvite(options?: DiscordInvite) {
    return this.session.rest.runMethod<DiscordInviteCreate>(
      this.session.rest,
      "POST",
      Routes.CHANNEL_INVITES(this.id),
      options,
    );
  }

  async createThread(options: ThreadCreateOptions): Promise<ThreadChannel> {
    const thread = await this.session.rest.runMethod<DiscordChannel>(
      this.session.rest,
      "POST",
      Routes.CHANNEL_CREATE_THREAD(this.id),
      options,
    );
    return new ThreadChannel(this.session, thread, this.guildId);
  }

  async fetchMessages(options?: GetMessagesOptions): Promise<Message[] | []> {
    if (options?.limit! > 100) throw Error("Values must be between 0-100")
    const messages = await this.session.rest.runMethod<DiscordMessage[]>(
      this.session.rest,
      "GET",
      Routes.CHANNEL_MESSAGES(this.id, options)
    )
    return messages[0] ? messages.map((x) => new Message(this.session, x)) : [];
  }

  sendTyping() {
    this.session.rest.runMethod<undefined>(
      this.session.rest,
      "POST",
      Routes.CHANNEL_TYPING(this.id),
    );
  }
}
