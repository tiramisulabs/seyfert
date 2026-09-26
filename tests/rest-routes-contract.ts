import type {
	APIApplication,
	ApiHandler,
	AuditLogEvent,
	Client,
	GuildOnboardingStructure,
	GuildWelcomeScreenStructure,
	RESTDeleteRemoveTargetUserResult,
	RESTGetAPIApplicationCommandPermissionsResult,
	RESTGetAPIAuditLogResult,
	RESTGetAPIGuildOnboardingResult,
	RESTGetAPIInviteResult,
	RESTGetAPIOAuth2CurrentApplicationResult,
	RESTGetAPISKUSubscriptionResult,
	RESTGetAPISKUSubscriptionsResult,
	RESTGetAPIVoiceRegionsResult,
	RESTPatchAPIWebhookWithTokenMessageResult,
	RESTPatchAPIWebhookWithTokenResult,
	RESTPostAPIChannelInviteJSONBody,
	RESTPostAPIChannelInviteResult,
	RESTPostAPIGuildBulkBanResult,
	RESTPostBulkAddTargetUsersResult,
	RESTPostBulkDeleteTargetUsersResult,
	RESTPutAddTargetUserResult,
	RESTPutAPIApplicationCommandPermissionsResult,
	RESTPutAPIGuildIncidentActionsResult,
	RESTPutAPIGuildOnboardingResult,
	Snowflake,
} from 'seyfert';

declare const api: ApiHandler;
declare const client: Client;
declare function expectType<T>(value: T): void;

expectType<Promise<GuildOnboardingStructure>>(client.guilds.onboarding.fetch('guild-id'));
expectType<Promise<GuildWelcomeScreenStructure>>(client.guilds.welcome.fetch('guild-id'));
expectType<Promise<RESTGetAPIAuditLogResult>>(client.guilds.audit.fetch('guild-id', { limit: 50 }));
expectType<Promise<RESTGetAPIAuditLogResult>>(client.guilds.audit.fetch('guild-id', { user_id: 'user-id' }));
expectType<Promise<RESTGetAPIAuditLogResult>>(client.guilds.audit.fetch('guild-id', { action_type: 1 as AuditLogEvent }));

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
expectType<Promise<RESTPutAddTargetUserResult>>(
	api.proxy.invites('invite-code')['target-users']('user-id').put(),
);
expectType<Promise<RESTDeleteRemoveTargetUserResult>>(
	api.proxy.invites('invite-code')['target-users']('user-id').delete(),
);
const readonlyTargetUserIds = ['user-id'] as const;
expectType<Promise<RESTPostBulkAddTargetUsersResult>>(
	api.proxy.invites('invite-code')['target-users']['bulk-add'].post({ body: { user_ids: ['user-id'] } }),
);
expectType<Promise<RESTPostBulkAddTargetUsersResult>>(
	api.proxy.invites('invite-code')['target-users']['bulk-add'].post({ body: { user_ids: readonlyTargetUserIds } }),
);
expectType<Promise<RESTPostBulkDeleteTargetUsersResult>>(
	api.proxy.invites('invite-code')['target-users']['bulk-delete'].post({ body: { user_ids: ['user-id'] } }),
);
expectType<Promise<RESTPostBulkDeleteTargetUsersResult>>(
	api.proxy
		.invites('invite-code')
		['target-users']['bulk-delete'].post({ body: { user_ids: readonlyTargetUserIds } }),
);
const createInviteBody: RESTPostAPIChannelInviteJSONBody = { target_user_ids: ['user-id'] };
expectType<readonly Snowflake[] | undefined>(createInviteBody.target_user_ids);
const readonlyCreateInviteBody: RESTPostAPIChannelInviteJSONBody = { target_user_ids: readonlyTargetUserIds };
expectType<readonly Snowflake[] | undefined>(readonlyCreateInviteBody.target_user_ids);
expectType<Promise<RESTPostAPIChannelInviteResult>>(
	api.proxy.channels('channel-id').invites.post({ body: { target_user_ids: ['user-id'] } }),
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
// @ts-expect-error Bulk-adding target users requires a user_ids body.
api.proxy.invites('invite-code')['target-users']['bulk-add'].post();
// @ts-expect-error Bulk-deleting target users requires a user_ids body.
api.proxy.invites('invite-code')['target-users']['bulk-delete'].post();
// @ts-expect-error target_user_ids must be an array of snowflake strings.
const badCreateInviteBody: RESTPostAPIChannelInviteJSONBody = { target_user_ids: 'user-id' };
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
