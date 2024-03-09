import type { RESTPatchAPIGuildTemplateJSONBody, RESTPostAPIGuildTemplatesJSONBody } from 'discord-api-types/v10';
import { BaseShorter } from './base';

export class TemplateShorter extends BaseShorter {
	get templates() {
		return {
			fetch: (code: string) => {
				return this.client.proxy.guilds.templates(code).get();
			},
			list: (guildId: string) => {
				return this.client.proxy.guilds(guildId).templates.get();
			},
			create: (guildId: string, body: RESTPostAPIGuildTemplatesJSONBody) => {
				return this.client.proxy.guilds(guildId).templates.post({ body });
			},
			sync: (guildId: string, code: string) => {
				return this.client.proxy.guilds(guildId).templates(code).put({});
			},
			edit: (guildId: string, code: string, body: RESTPatchAPIGuildTemplateJSONBody) => {
				return this.client.proxy.guilds(guildId).templates(code).patch({ body });
			},
			delete: (guildId: string, code: string) => {
				return this.client.proxy.guilds(guildId).templates(code).delete();
			},
		};
	}
}
