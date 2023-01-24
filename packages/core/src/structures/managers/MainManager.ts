import type { Session } from '../../session';
import { GuildManager } from './GuildManager';
import { UserManager } from './UserManager';


export class MainManager {
	constructor(private readonly session: Session) {
		this.user = new UserManager(this.session);
		this.guild = new GuildManager(this.session);
	}

	user: UserManager;
	guild: GuildManager;
}
