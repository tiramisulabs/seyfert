import type {
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
	RESTPostAPIWebhookWithTokenWaitResult,
} from 'discord-api-types/v10';
import type { ProxyRequestMethod } from '../Router';
import type { RestArguments } from '../api';

export interface WebhookRoutes {
	webhooks(id: string): {
		get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIWebhookResult>;
		patch(
			args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIWebhookJSONBody>,
		): Promise<RESTPatchAPIWebhookResult>;
		delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIWebhookResult>;
		(
			token: string,
		): {
			get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIWebhookWithTokenResult>;
			patch(
				args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIWebhookWithTokenJSONBody>,
			): Promise<RESTPatchAPIWebhookWithTokenResult>;
			delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIWebhookWithTokenResult>;
			post(
				args: RestArguments<
					ProxyRequestMethod.Post,
					RESTPostAPIWebhookWithTokenJSONBody,
					RESTPostAPIWebhookWithTokenQuery
				>,
			): Promise<RESTPostAPIWebhookWithTokenResult | RESTPostAPIWebhookWithTokenWaitResult>;
			slack: {
				post(
					args: RestArguments<
						ProxyRequestMethod.Post,
						RESTPostAPIWebhookWithTokenJSONBody,
						RESTPostAPIWebhookWithTokenSlackQuery
					>,
				): Promise<RESTPostAPIWebhookWithTokenSlackResult | RESTPostAPIWebhookWithTokenSlackWaitResult>;
			};
			github: {
				post(
					args: RestArguments<
						ProxyRequestMethod.Post,
						RESTPostAPIWebhookWithTokenJSONBody,
						RESTPostAPIWebhookWithTokenGitHubQuery
					>,
				): Promise<RESTPostAPIWebhookWithTokenGitHubResult | RESTPostAPIWebhookWithTokenGitHubWaitResult>;
			};
			messages: (id: string | '@original') => {
				get(args?: RestArguments<ProxyRequestMethod.Get>): Promise<RESTGetAPIWebhookWithTokenMessageResult>;
				patch(
					args: RestArguments<ProxyRequestMethod.Patch, RESTPatchAPIWebhookWithTokenMessageJSONBody>,
				): Promise<RESTPatchAPIWebhookWithTokenMessageResult>;
				delete(args?: RestArguments<ProxyRequestMethod.Delete>): Promise<RESTDeleteAPIWebhookWithTokenMessageResult>;
			};
		};
	};
}
