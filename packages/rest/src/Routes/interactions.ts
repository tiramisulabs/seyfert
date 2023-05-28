import { RESTPostAPIInteractionCallbackJSONBody } from '@biscuitland/common';
import { RestArguments } from '../REST';
import { RequestMethod } from '../Router';

export interface InteractionRoutes {
  interactions: {
    (id: string): {
      (token: string): {
        callback: {
          post(args: RestArguments<RequestMethod.Post, RESTPostAPIInteractionCallbackJSONBody>): Promise<never>;
        };
      };
    };
  };
}
