import type { RESTGetAPIGatewayBotResult, RESTGetAPIGatewayResult } from 'discord-api-types/v10';
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
