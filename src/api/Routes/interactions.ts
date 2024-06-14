import type { RESTPostAPIInteractionCallbackJSONBody } from 'discord-api-types/v10';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';

export interface InteractionRoutes {
	interactions: (id: string) => (token: string) => {
		callback: {
			post(args: RestArguments<ProxyRequestMethod.Post, RESTPostAPIInteractionCallbackJSONBody>): Promise<never>;
		};
	};
}
