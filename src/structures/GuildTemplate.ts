import type { GuildStructure, GuildTemplateStructure } from '../client';
import type { UsingClient } from '../commands';
import type { MethodContext, ObjectToLower } from '../common';
import type { APITemplate, RESTPatchAPIGuildTemplateJSONBody, RESTPostAPIGuildTemplatesJSONBody } from '../types';
import { Base } from './extra/Base';

export interface GuildTemplate extends Base, ObjectToLower<APITemplate> {}

export class GuildTemplate extends Base {
	constructor(client: UsingClient, data: APITemplate) {
		super(client);
		this.__patchThis(data);
	}

	guild(force = false): Promise<GuildStructure<'api'>> {
		return this.client.guilds.fetch(this.sourceGuildId, force);
	}

	fetch(): Promise<GuildTemplateStructure> {
		return this.client.templates.fetch(this.sourceGuildId);
	}

	sync(): Promise<GuildTemplateStructure> {
		return this.client.templates.sync(this.sourceGuildId, this.code);
	}

	edit(body: RESTPatchAPIGuildTemplateJSONBody): Promise<GuildTemplateStructure> {
		return this.client.templates.edit(this.sourceGuildId, this.code, body);
	}

	delete(): Promise<GuildTemplateStructure> {
		return this.client.templates.delete(this.sourceGuildId, this.code);
	}

	static methods(ctx: MethodContext<{ guildId: string }>) {
		return {
			fetch: (code: string): Promise<GuildTemplateStructure> => ctx.client.templates.fetch(code),
			list: (): Promise<GuildTemplateStructure[]> => ctx.client.templates.list(ctx.guildId),
			create: (body: RESTPostAPIGuildTemplatesJSONBody): Promise<GuildTemplateStructure> =>
				ctx.client.templates.create(ctx.guildId, body),
			sync: (code: string): Promise<GuildTemplateStructure> => ctx.client.templates.sync(ctx.guildId, code),
			edit: (code: string, body: RESTPatchAPIGuildTemplateJSONBody): Promise<GuildTemplateStructure> =>
				ctx.client.templates.edit(ctx.guildId, code, body),
			delete: (code: string): Promise<GuildTemplateStructure> => ctx.client.templates.delete(ctx.guildId, code),
		};
	}
}
