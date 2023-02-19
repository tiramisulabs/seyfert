import type { APIUser } from "discord-api-types/v10";
import type { Session } from "../../session";
import { User } from "../User";

export class UserManager {
	readonly session!: Session;
	constructor(session: Session) {
		Object.defineProperty(this, "session", {
			value: session,
			writable: false,
		});
	}

	async fetch(userId: string): Promise<User | undefined> {
		const user = await this.session.api
			.users(userId)
			.get<APIUser>()
			.then((u) => new User(this.session, u))
			.catch((_) => undefined);
		return user;
	}
}
