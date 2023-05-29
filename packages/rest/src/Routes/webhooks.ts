import {
  RESTDeleteAPIWebhookResult,
  RESTDeleteAPIWebhookWithTokenMessageResult,
  RESTDeleteAPIWebhookWithTokenResult,
  RESTGetAPIWebhookResult,
  RESTGetAPIWebhookWithTokenMessageResult,
  RESTGetAPIWebhookWithTokenResult,
  RESTPatchAPIWebhookJSONBody,
  RESTPatchAPIWebhookResult,
  RESTPatchAPIWebhookWithTokenJSONBody,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPatchAPIWebhookWithTokenMessageResult,
  RESTPatchAPIWebhookWithTokenResult,
  RESTPostAPIWebhookWithTokenGitHubQuery,
  RESTPostAPIWebhookWithTokenGitHubResult,
  RESTPostAPIWebhookWithTokenGitHubWaitResult,
  RESTPostAPIWebhookWithTokenJSONBody,
  RESTPostAPIWebhookWithTokenQuery,
  RESTPostAPIWebhookWithTokenResult,
  RESTPostAPIWebhookWithTokenSlackQuery,
  RESTPostAPIWebhookWithTokenSlackResult,
  RESTPostAPIWebhookWithTokenSlackWaitResult,
  RESTPostAPIWebhookWithTokenWaitResult
} from '@biscuitland/common';
import { RestArguments } from '../REST';
import { RequestMethod } from '../Router';

export interface WebhookRoutes {
  webhooks(id: string): {
    get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIWebhookResult>;
    patch(args: RestArguments<RequestMethod.Patch, RESTPatchAPIWebhookJSONBody>): Promise<RESTPatchAPIWebhookResult>;
    delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIWebhookResult>;
    (token: string): {
      get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIWebhookWithTokenResult>;
      patch(args: RestArguments<RequestMethod.Patch, RESTPatchAPIWebhookWithTokenJSONBody>): Promise<RESTPatchAPIWebhookWithTokenResult>;
      delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIWebhookWithTokenResult>;
      post(
        args: RestArguments<RequestMethod.Post, RESTPostAPIWebhookWithTokenJSONBody, RESTPostAPIWebhookWithTokenQuery>
      ): Promise<RESTPostAPIWebhookWithTokenResult | RESTPostAPIWebhookWithTokenWaitResult>;
      slack: {
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPIWebhookWithTokenJSONBody, RESTPostAPIWebhookWithTokenSlackQuery>
        ): Promise<RESTPostAPIWebhookWithTokenSlackResult | RESTPostAPIWebhookWithTokenSlackWaitResult>;
      };
      github: {
        post(
          args: RestArguments<RequestMethod.Post, RESTPostAPIWebhookWithTokenJSONBody, RESTPostAPIWebhookWithTokenGitHubQuery>
        ): Promise<RESTPostAPIWebhookWithTokenGitHubResult | RESTPostAPIWebhookWithTokenGitHubWaitResult>;
      };
      messages: {
        (id: string | '@original'): {
          get(args?: RestArguments<RequestMethod.Get>): Promise<RESTGetAPIWebhookWithTokenMessageResult>;
          patch(
            args: RestArguments<RequestMethod.Patch, RESTPatchAPIWebhookWithTokenMessageJSONBody>
          ): Promise<RESTPatchAPIWebhookWithTokenMessageResult>;
          delete(args?: RestArguments<RequestMethod.Delete>): Promise<RESTDeleteAPIWebhookWithTokenMessageResult>;
        };
      };
    };
  };
}
