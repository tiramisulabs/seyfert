import type { AutoModerationRuleStructure, GuildMemberStructure, GuildStructure } from '../client';
import type { UsingClient } from '../commands';
import type { MethodContext, ObjectToLower } from '../common';
import type {
	APIAutoModerationRule,
	RESTPatchAPIAutoModerationRuleJSONBody,
	RESTPostAPIAutoModerationRuleJSONBody,
} from '../types';
import { DiscordBase } from './extra/DiscordBase';

export interface AutoModerationRule extends ObjectToLower<APIAutoModerationRule> {}

export class AutoModerationRule extends DiscordBase<APIAutoModerationRule> {
	constructor(client: UsingClient, data: APIAutoModerationRule) {
		super(client, data);
	}

	fetchCreator(force = false): Promise<GuildMemberStructure> {
		return this.client.members.fetch(this.guildId, this.creatorId, force);
	}

	guild(force = false): Promise<GuildStructure<'api'>> {
		return this.client.guilds.fetch(this.guildId, force);
	}

	fetch(): Promise<AutoModerationRuleStructure> {
		return this.client.guilds.moderation.fetch(this.guildId, this.id);
	}

	edit(body: RESTPatchAPIAutoModerationRuleJSONBody, reason?: string): Promise<AutoModerationRuleStructure> {
		return this.client.guilds.moderation.edit(this.guildId, this.id, body, reason);
	}

	delete(reason?: string) {
		return this.client.guilds.moderation.delete(this.guildId, this.id, reason);
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			list: (): Promise<AutoModerationRuleStructure[]> => client.guilds.moderation.list(guildId),
			create: (body: RESTPostAPIAutoModerationRuleJSONBody): Promise<AutoModerationRuleStructure> =>
				client.guilds.moderation.create(guildId, body),
			delete: (ruleId: string, reason?: string) => client.guilds.moderation.delete(guildId, ruleId, reason),
			fetch: (ruleId: string): Promise<AutoModerationRuleStructure> => client.guilds.moderation.fetch(guildId, ruleId),
			edit: (
				ruleId: string,
				body: RESTPatchAPIAutoModerationRuleJSONBody,
				reason?: string,
			): Promise<AutoModerationRuleStructure> => client.guilds.moderation.edit(guildId, ruleId, body, reason),
		};
	}
}
