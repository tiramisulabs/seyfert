import type { RESTGetAPIGatewayBotResult, RESTGetAPIGatewayResult } from '../../types';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';

export interface GatewayRoutes {
	gateway: {
		get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGatewayResult>;
		bot: {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGatewayBotResult>;
		};
	};
}
