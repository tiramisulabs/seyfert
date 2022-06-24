import { Channel } from "./Channel.ts";
import { DiscordChannel, Routes, Session } from "../mod.ts";

export class GuildChannel extends Channel {
  constructor(session: Session, data: DiscordChannel) {
    super(session, data);
    this.guild_id = data.guild_id;
  }

  guild_id?: string;

  get topic() {
    return this.data.topic;
  }

  get guildId() {
    return this.guild_id;
  }

  delete(reason?: string) {
    return this.session.rest.runMethod<DiscordChannel>(
      this.session.rest,
      "DELETE",
      Routes.CHANNEL(this.id),
      {
        reason,
      },
    );
  }
}
