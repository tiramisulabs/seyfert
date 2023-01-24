import type { Session } from '../../session';
import type { EditNickname } from '../../utils/types';

export class GuildManager {
	constructor(private readonly session: Session) {}

	async setNickname(
		guildId: string,
		memberId = '@me',
		options?: EditNickname
	): Promise<string | undefined> {
		return this.session.api
			.guilds(guildId)
			.members(memberId)
			.patch<void>(
				{ body: { nick: options?.nick } },
				{ reason: options?.reason }
			)
			.then(_ => options?.nick)
			.catch(_ => undefined);
	}
}
