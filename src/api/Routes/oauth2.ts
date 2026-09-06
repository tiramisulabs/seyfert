import type { RESTGetAPIOAuth2CurrentApplicationResult } from '../../types';
import type { RestArgumentsNoBody } from '../api';

export interface OAuth2Routes {
	oauth2: {
		applications: {
			'@me': {
				get(args?: RestArgumentsNoBody): Promise<RESTGetAPIOAuth2CurrentApplicationResult>;
			};
		};
	};
}
