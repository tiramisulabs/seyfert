import type { Session } from "../../session";
import { ChannelManager } from "./ChannelManager";
import { GuildManager } from "./GuildManager";
import { MemberManager } from "./MemberManager";
import { UserManager } from "./UserManager";

export class MainManager {
	constructor(private readonly session: Session) {
		this.users = new UserManager(this.session);
		this.guilds = new GuildManager(this.session);
		this.members = new MemberManager(this.session);
		this.channels = new ChannelManager(this.session);
	}

	users: UserManager;
	guilds: GuildManager;
	members: MemberManager;
	channels: ChannelManager;
}
