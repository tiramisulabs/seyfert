import type { OmitInsert } from '../../common';
import type {
	RESTPostAPIInteractionCallbackJSONBody,
	RESTPostAPIInteractionCallbackQuery,
	RESTPostAPIInteractionCallbackResult,
} from '../../types';
import type { RestArguments } from '../api';

export interface InteractionRoutes {
	interactions: (id: string) => (token: string) => {
		callback: {
			post(
				args: RestArguments<
					RESTPostAPIInteractionCallbackJSONBody,
					OmitInsert<RESTPostAPIInteractionCallbackQuery, 'with_response', { with_response: true }>
				>,
			): Promise<RESTPostAPIInteractionCallbackResult>;
			post(
				args: RestArguments<
					RESTPostAPIInteractionCallbackJSONBody,
					OmitInsert<RESTPostAPIInteractionCallbackQuery, 'with_response', { with_response: false }>
				>,
			): Promise<undefined>;
			post(
				args: RestArguments<RESTPostAPIInteractionCallbackJSONBody, RESTPostAPIInteractionCallbackQuery>,
			): Promise<RESTPostAPIInteractionCallbackResult | undefined>;
		};
	};
}
