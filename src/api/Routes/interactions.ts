import type {
	RESTPostAPIInteractionCallbackJSONBody,
	RESTPostAPIInteractionCallbackQuery,
	RESTPostAPIInteractionCallbackResult,
} from '../../types';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';

export interface InteractionRoutes {
	interactions: (id: string) => (token: string) => {
		callback: {
			post(
				args: RestArguments<
					ProxyRequestMethod.Post,
					RESTPostAPIInteractionCallbackJSONBody,
					Omit<RESTPostAPIInteractionCallbackQuery, 'with_response'> & { with_response: true }
				>,
			): Promise<RESTPostAPIInteractionCallbackResult>;
			post(
				args: RestArguments<
					ProxyRequestMethod.Post,
					RESTPostAPIInteractionCallbackJSONBody,
					Omit<RESTPostAPIInteractionCallbackQuery, 'with_response'> & { with_response: false }
				>,
			): Promise<undefined>;
			post(
				args: RestArguments<
					ProxyRequestMethod.Post,
					RESTPostAPIInteractionCallbackJSONBody,
					RESTPostAPIInteractionCallbackQuery
				>,
			): Promise<RESTPostAPIInteractionCallbackResult | undefined>;
		};
	};
}
