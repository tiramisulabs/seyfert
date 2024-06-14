import type { GatewayTypingStartDispatchData } from 'discord-api-types/v10';
import { toCamelCase } from '../../common';
import { GuildMember } from '../../structures';
import type { UsingClient } from '../../commands';

export const TYPING_START = (self: UsingClient, data: GatewayTypingStartDispatchData) => {
	return data.member
		? {
				...toCamelCase(data),
				member: new GuildMember(self, data.member, data.member.user!, data.guild_id!),
			}
		: toCamelCase(data);
};
