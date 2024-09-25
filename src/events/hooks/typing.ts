import { Transformers } from '../../client/transformers';
import type { UsingClient } from '../../commands';
import { toCamelCase } from '../../common';
import type { GatewayTypingStartDispatchData } from '../../types';

export const TYPING_START = (self: UsingClient, data: GatewayTypingStartDispatchData) => {
	return data.member
		? {
				...toCamelCase(data),
				member: Transformers.GuildMember(self, data.member, data.member.user, data.guild_id!),
			}
		: toCamelCase(data);
};
