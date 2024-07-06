import type { RESTPatchAPIGuildTemplateJSONBody, RESTPostAPIGuildTemplatesJSONBody } from 'discord-api-types/v10';
import { BaseShorter } from './base';
import { Transformers } from '../../client/transformers';

export class TemplateShorter extends BaseShorter {
	fetch(code: string) {
		return this.client.proxy.guilds
			.templates(code)
			.get()
			.then(template => Transformers.GuildTemplate(this.client, template));
	}

	list(guildId: string) {
		return this.client.proxy
			.guilds(guildId)
			.templates.get()
			.then(list => list.map(template => Transformers.GuildTemplate(this.client, template)));
	}

	create(guildId: string, body: RESTPostAPIGuildTemplatesJSONBody) {
		return this.client.proxy
			.guilds(guildId)
			.templates.post({ body })
			.then(template => Transformers.GuildTemplate(this.client, template));
	}

	sync(guildId: string, code: string) {
		return this.client.proxy
			.guilds(guildId)
			.templates(code)
			.put({})
			.then(template => Transformers.GuildTemplate(this.client, template));
	}

	edit(guildId: string, code: string, body: RESTPatchAPIGuildTemplateJSONBody) {
		return this.client.proxy
			.guilds(guildId)
			.templates(code)
			.patch({ body })
			.then(template => Transformers.GuildTemplate(this.client, template));
	}

	delete(guildId: string, code: string) {
		return this.client.proxy
			.guilds(guildId)
			.templates(code)
			.delete()
			.then(template => Transformers.GuildTemplate(this.client, template));
	}
}
