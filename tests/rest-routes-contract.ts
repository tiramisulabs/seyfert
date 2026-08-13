import type {
	APIApplication,
	ApiHandler,
	RESTGetAPIApplicationCommandPermissionsResult,
	RESTGetAPIGuildOnboardingResult,
	RESTGetAPIInviteResult,
	RESTGetAPIOAuth2CurrentApplicationResult,
	RESTGetAPISKUSubscriptionResult,
	RESTGetAPISKUSubscriptionsResult,
	RESTGetAPIVoiceRegionsResult,
	RESTPatchAPIWebhookWithTokenMessageResult,
	RESTPatchAPIWebhookWithTokenResult,
	RESTPostAPIGuildBulkBanResult,
	RESTPutAPIApplicationCommandPermissionsResult,
	RESTPutAPIGuildIncidentActionsResult,
	RESTPutAPIGuildOnboardingResult,
} from 'seyfert';

declare const api: ApiHandler;
declare function expectType<T>(value: T): void;

expectType<Promise<RESTPostAPIGuildBulkBanResult>>(
	api.proxy.guilds('guild-id')['bulk-ban'].post({ body: { user_ids: ['user-id'] } }),
);
expectType<Promise<RESTGetAPIGuildOnboardingResult>>(api.proxy.guilds('guild-id').onboarding.get());
expectType<Promise<RESTPutAPIGuildOnboardingResult>>(
	api.proxy.guilds('guild-id').onboarding.put({ body: {} }),
);
expectType<Promise<RESTPutAPIGuildIncidentActionsResult>>(
	api.proxy.guilds('guild-id')['incident-actions'].put({ body: { dms_disabled_until: null } }),
);
expectType<Promise<RESTGetAPIVoiceRegionsResult>>(api.proxy.voice.regions.get());
expectType<Promise<RESTGetAPIOAuth2CurrentApplicationResult>>(api.proxy.oauth2.applications['@me'].get());
api.proxy.oauth2.applications['@me'].get().then(application => {
	expectType<APIApplication['flags']>(application.flags);
});
expectType<Promise<RESTGetAPISKUSubscriptionsResult>>(
	api.proxy.skus('sku-id').subscriptions.get({ query: { user_id: 'user-id' } }),
);
expectType<Promise<RESTGetAPISKUSubscriptionResult>>(
	api.proxy.skus('sku-id').subscriptions('subscription-id').get(),
);
expectType<Promise<RESTGetAPIInviteResult>>(
	api.proxy.invites('invite-code').get({ query: { with_counts: true } }),
);
expectType<Promise<RESTPatchAPIWebhookWithTokenResult>>(
	api.proxy.webhooks('webhook-id')('webhook-token').patch({ body: { name: 'renamed' } }),
);
expectType<Promise<RESTPatchAPIWebhookWithTokenMessageResult>>(
	api.proxy
		.webhooks('webhook-id')('webhook-token')
		.messages('message-id')
		.patch({ body: { content: 'edited' }, query: { thread_id: 'thread-id' } }),
);
expectType<Promise<RESTGetAPIApplicationCommandPermissionsResult>>(
	api.proxy
		.applications('application-id')
		.guilds('guild-id')
		.commands('command-id')
		.permissions.get(),
);
expectType<Promise<RESTPutAPIApplicationCommandPermissionsResult>>(
	api.proxy
		.applications('application-id')
		.guilds('guild-id')
		.commands('command-id')
		.permissions.put({ body: { permissions: [] } }),
);

// @ts-expect-error The Discord endpoint is singular: /guilds/{guild.id}/bulk-ban.
api.proxy.guilds('guild-id')['bulk-bans'].post({ body: { user_ids: ['user-id'] } });
// @ts-expect-error The Discord endpoint is plural: /voice/regions.
api.proxy.voice.region.get();
// @ts-expect-error Invite GET parameters belong in the query string.
api.proxy.invites('invite-code').get({ body: { with_counts: true } });
// @ts-expect-error SKU subscription list parameters belong in the query string.
api.proxy.skus('sku-id').subscriptions.get({ body: { user_id: 'user-id' } });
// @ts-expect-error The documented individual SKU subscription endpoint has no query parameters.
api.proxy.skus('sku-id').subscriptions('subscription-id').get({ query: { user_id: 'user-id' } });
// @ts-expect-error Modifying a webhook with a token does not accept message query parameters.
api.proxy.webhooks('webhook-id')('webhook-token').patch({ query: { thread_id: 'thread-id' } });
const applicationCommandPermissions = api.proxy
	.applications('application-id')
	.guilds('guild-id')
	.commands('command-id')
	.permissions;
// @ts-expect-error Editing command permissions requires a JSON body.
applicationCommandPermissions.put();
