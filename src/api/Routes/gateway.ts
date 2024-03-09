import type { RESTGetAPIGatewayBotResult, RESTGetAPIGatewayResult } from '../../common';
import type { RestArguments } from '../api';
import type { ProxyRequestMethod } from '../Router';

export interface GatewayRoutes {
	gateway: {
		get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGatewayResult>;
		bot: {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIGatewayBotResult>;
		};
	};
}
