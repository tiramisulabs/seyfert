import { RESTGetAPIGatewayResult, RESTGetAPIGatewayBotResult } from '@biscuitland/common';
import { RestArguments } from '../REST';
import { RequestMethod } from '../Router';

export interface GatewayRoutes {
  gateway: {
    get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGatewayResult>;
    bot: {
      get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIGatewayBotResult>;
    };
  };
}
