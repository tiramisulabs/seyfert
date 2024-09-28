import type { RESTGetAPIGatewayBotResult, RESTGetAPIGatewayResult } from '../../types';
import type { RestArgumentsNoBody } from '../api';

export interface GatewayRoutes {
	gateway: {
		get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGatewayResult>;
		bot: {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPIGatewayBotResult>;
		};
	};
}
