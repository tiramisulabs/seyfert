import type { APIGuild } from '@biscuitland/common';
import type { Session } from '../session';
import { AnonymousGuild } from './AnonymousGuild';

export class InviteGuild extends AnonymousGuild {
	constructor(session: Session, data: APIGuild) {
		super(session, data);
		this.welcomeScreen = {};
	}

	welcomeScreen?: any; // TODO
}
