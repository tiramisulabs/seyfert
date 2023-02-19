import { APIUser } from "discord-api-types/v10";
import { Session } from "../index";
import { User } from "./mod";

export class ClientUser extends User {
	constructor(session: Session, user: APIUser) {
		super(session, user);
	}

	override bot = true;
}
