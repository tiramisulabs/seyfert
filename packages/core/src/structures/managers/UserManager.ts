import type { APIUser } from 'discord-api-types/v10';
import type { Session } from '../../session';
import { User } from '../User';

export class UserManager {
	constructor(private readonly session: Session) {}

	async fetch(userId: string): Promise<User | undefined> {
		const user = await this.session.api
			.users(userId)
			.get<APIUser>()
			.then((u) => new User(this.session, u))
			.catch((_) => undefined);
		return user;
	}
}
