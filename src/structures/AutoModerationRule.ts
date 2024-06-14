import type {
	APIAutoModerationRule,
	RESTPatchAPIAutoModerationRuleJSONBody,
	RESTPostAPIAutoModerationRuleJSONBody,
} from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import { toCamelCase, type MethodContext, type ObjectToLower } from '../common';
import { DiscordBase } from './extra/DiscordBase';

export interface AutoModerationRule extends ObjectToLower<APIAutoModerationRule> {}

export class AutoModerationRule extends DiscordBase<APIAutoModerationRule> {
	constructor(client: UsingClient, data: APIAutoModerationRule) {
		super(client, data);
	}

	fetchCreator(force = false) {
		return this.client.members.fetch(this.guildId, this.creatorId, force);
	}

	guild(force = false) {
		return this.client.guilds.fetch(this.guildId, force);
	}

	fetch() {
		return this.client.guilds.moderation.fetch(this.guildId, this.id);
	}

	edit(body: ObjectToLower<RESTPatchAPIAutoModerationRuleJSONBody>, reason?: string) {
		return this.client.guilds.moderation.edit(this.guildId, this.id, body, reason);
	}

	delete(reason?: string) {
		return this.client.guilds.moderation.delete(this.guildId, this.id, reason);
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			list: () => client.guilds.moderation.list(guildId),
			create: (body: RESTPostAPIAutoModerationRuleJSONBody) => client.guilds.moderation.create(guildId, body),
			delete: (ruleId: string, reason?: string) => client.guilds.moderation.delete(guildId, ruleId, reason),
			fetch: (ruleId: string) => client.guilds.moderation.fetch(guildId, ruleId),
			edit: (ruleId: string, body: RESTPatchAPIAutoModerationRuleJSONBody, reason?: string) =>
				client.guilds.moderation.edit(guildId, ruleId, toCamelCase(body), reason),
		};
	}
}
