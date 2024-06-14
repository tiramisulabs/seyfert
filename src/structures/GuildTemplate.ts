import type {
	APITemplate,
	RESTPatchAPIGuildTemplateJSONBody,
	RESTPostAPIGuildTemplatesJSONBody,
} from 'discord-api-types/v10';
import type { UsingClient } from '../commands';
import type { MethodContext, ObjectToLower } from '../common';
import { Base } from './extra/Base';

export interface GuildTemplate extends Base, ObjectToLower<APITemplate> {}

export class GuildTemplate extends Base {
	constructor(client: UsingClient, data: APITemplate) {
		super(client);
		this.__patchThis(data);
	}

	guild(force = false) {
		return this.client.guilds.fetch(this.sourceGuildId, force);
	}

	async fetch() {
		return this.client.templates.fetch(this.sourceGuildId);
	}

	sync() {
		return this.client.templates.sync(this.sourceGuildId, this.code);
	}

	edit(body: RESTPatchAPIGuildTemplateJSONBody) {
		return this.client.templates.edit(this.sourceGuildId, this.code, body);
	}

	delete() {
		return this.client.templates.delete(this.sourceGuildId, this.code);
	}

	static methods(ctx: MethodContext<{ guildId: string }>) {
		return {
			fetch: (code: string) => ctx.client.templates.fetch(code),
			list: () => ctx.client.templates.list(ctx.guildId),
			create: (body: RESTPostAPIGuildTemplatesJSONBody) => ctx.client.templates.create(ctx.guildId, body),
			sync: (code: string) => ctx.client.templates.sync(ctx.guildId, code),
			edit: (code: string, body: RESTPatchAPIGuildTemplateJSONBody) =>
				ctx.client.templates.edit(ctx.guildId, code, body),
			delete: (code: string) => ctx.client.templates.delete(ctx.guildId, code),
		};
	}
}
