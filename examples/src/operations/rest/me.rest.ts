import { DiscordUser } from '@biscuitland/api-types';
import { DefaultRestAdapter } from '@biscuitland/rest';

export class MeRest {
	rest: DefaultRestAdapter;

	constructor(rest: DefaultRestAdapter) {
		this.rest = rest;

		if (rest) {
			this.execute();
		}
	}

	async execute() {
		const { username } = await this.rest.get<DiscordUser>('/users/@me');

		if (username) {
			console.log('[1/1] successful [%s]', username);
		}
	}
}
