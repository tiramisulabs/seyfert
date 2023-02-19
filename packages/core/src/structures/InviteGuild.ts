import type { APIGuild } from "discord-api-types/v10";
import type { Session } from "../session";
import { AnonymousGuild } from "./AnonymousGuild";

export class InviteGuild extends AnonymousGuild {
	constructor(session: Session, data: APIGuild) {
		super(session, data);
		this.welcomeScreen = {};
	}

	welcomeScreen?: any; // TODO
}
