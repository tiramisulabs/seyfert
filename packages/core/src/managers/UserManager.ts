import type {
  APIUser,
  RESTGetAPICurrentUserGuildsQuery,
  RESTPatchAPICurrentUserJSONBody,
  RESTPutAPICurrentUserApplicationRoleConnectionJSONBody,
} from "@biscuitland/common";
import type { ImageOptions, Session } from "../index";
import { formatImageURL } from "../index";

export class UserManager {
  readonly session!: Session;
  constructor(session: Session) {
    Object.defineProperty(this, "session", {
      value: session,
      writable: false,
    });
  }

  get(userId = "@me") {
    return this.session.api.users(userId).get();
  }

  avatarURL(user: APIUser, { size, format }: ImageOptions = {}) {
    if (user.avatar?.length) {
      return formatImageURL(this.session.cdn.avatars(user.id).get(user.avatar), size, format);
    }

    return formatImageURL(this.session.cdn.embed.avatars.get(Number(user.discriminator) % 5));
  }

  createDM(userId: string) {
    return this.session.api.users("@me").channels.post({ body: { recipient_id: userId } });
  }

  editCurrent(body: RESTPatchAPICurrentUserJSONBody) {
    return this.session.api.users("@me").patch({
      body,
    });
  }

  getGuilds(query?: RESTGetAPICurrentUserGuildsQuery) {
    return this.session.api.users("@me").guilds.get({ query });
  }

  getGuildMember(guildId: string) {
    return this.session.api.users("@me").guilds(guildId).member.get();
  }

  leaveGuild(guildId: string) {
    return this.session.api.users("@me").guilds(guildId).delete();
  }

  getConnections() {
    return this.session.api.users("@me").connections.get();
  }

  getRoleConnections(applicationId: string) {
    return this.session.api.users("@me").applications(applicationId)["role-connection"].get();
  }

  updateRoleConnection(applicationId: string, body: RESTPutAPICurrentUserApplicationRoleConnectionJSONBody) {
    return this.session.api.users("@me").applications(applicationId)["role-connection"].put({ body });
  }
}
