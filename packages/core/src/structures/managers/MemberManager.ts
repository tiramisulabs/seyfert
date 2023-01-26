import type { Session } from '../../session';
import type { APIGuildMember } from 'discord-api-types/v10';

export class MemberManager {
	constructor(private readonly session: Session) {}
}
