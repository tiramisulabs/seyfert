import type { Session } from '../../session';
import { GuildManager } from './GuildManager';
import { UserManager } from './UserManager';

export class MainManager {
	constructor(private readonly session: Session) {}

	users: UserManager = new UserManager(this.session);
	guilds: GuildManager = new GuildManager(this.session);
}
