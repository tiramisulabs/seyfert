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
} from '../../types';
import type { RestArguments, RestArgumentsNoBody } from '../api';

export interface WebhookRoutes {
	webhooks(id: string): {
		get(args?: RestArgumentsNoBody): Promise<RESTGetAPIWebhookResult>;
		patch(args: RestArguments<RESTPatchAPIWebhookJSONBody>): Promise<RESTPatchAPIWebhookResult>;
		delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIWebhookResult>;
		(
			token: string,
		): {
			get(args?: RestArgumentsNoBody): Promise<RESTGetAPIWebhookWithTokenResult>;
			patch(args: RestArguments<RESTPatchAPIWebhookWithTokenJSONBody>): Promise<RESTPatchAPIWebhookWithTokenResult>;
			delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIWebhookWithTokenResult>;
			post(
				args: RestArguments<RESTPostAPIWebhookWithTokenJSONBody, RESTPostAPIWebhookWithTokenQuery>,
			): Promise<RESTPostAPIWebhookWithTokenResult | RESTPostAPIWebhookWithTokenWaitResult>;
			slack: {
				post(
					args: RestArguments<RESTPostAPIWebhookWithTokenJSONBody, RESTPostAPIWebhookWithTokenSlackQuery>,
				): Promise<RESTPostAPIWebhookWithTokenSlackResult | RESTPostAPIWebhookWithTokenSlackWaitResult>;
			};
			github: {
				post(
					args: RestArguments<RESTPostAPIWebhookWithTokenJSONBody, RESTPostAPIWebhookWithTokenGitHubQuery>,
				): Promise<RESTPostAPIWebhookWithTokenGitHubResult | RESTPostAPIWebhookWithTokenGitHubWaitResult>;
			};
			messages: (id: string) => {
				get(args?: RestArgumentsNoBody<{ thread_id: string }>): Promise<RESTGetAPIWebhookWithTokenMessageResult>;
				patch(
					args: RestArguments<RESTPatchAPIWebhookWithTokenMessageJSONBody>,
				): Promise<RESTPatchAPIWebhookWithTokenMessageResult>;
				delete(args?: RestArgumentsNoBody): Promise<RESTDeleteAPIWebhookWithTokenMessageResult>;
			};
		};
	};
}
