import { APIUser } from '@biscuitland/common';
import { Session } from '../index';
import { User } from './mod';

export class ClientUser extends User {
	constructor(session: Session, user: APIUser) {
		super(session, user);
	}

	override bot = true;
}
