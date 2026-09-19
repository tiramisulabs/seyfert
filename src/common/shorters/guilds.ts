import { resolveFiles } from '../../builders';
import { CacheFrom } from '../../cache';
import {
	type AnonymousGuildStructure,
	type AutoModerationRuleStructure,
	type GuildMemberStructure,
	type GuildOnboardingStructure,
	type GuildScheduledEventStructure,
	type GuildScheduledSubscriberStructure,
	type GuildStructure,
	type GuildWelcomeScreenStructure,
	type MessageStructure,
	type StickerStructure,
	Transformers,
} from '../../client/transformers';
import type { SeyfertChannelMap } from '../../commands';
import {
	type AllChannels,
	BaseChannel,
	type CreateStickerBodyRequest,
	channelFrom,
	type GuildChannelTypes,
} from '../../structures';
import type {
	APIChannel,
	APIGuildWidget,
	APIGuildWidgetSettings,
	GuildWidgetStyle,
	RESTGetAPIAuditLogQuery,
	RESTGetAPICurrentUserGuildsQuery,
	RESTGetAPIGuildMessagesSearch,
	RESTGetAPIGuildMessagesSearchQuery,
	RESTGetAPIGuildMessagesSearchResult,
	RESTGetAPIGuildQuery,
	RESTGetAPIGuildScheduledEventQuery,
	RESTGetAPIGuildScheduledEventsQuery,
	RESTGetAPIGuildScheduledEventUsersQuery,
	RESTGetAPIGuildWidgetImageQuery,
	RESTPatchAPIAutoModerationRuleJSONBody,
	RESTPatchAPIChannelJSONBody,
	RESTPatchAPIGuildChannelPositionsJSONBody,
	RESTPatchAPIGuildJSONBody,
	RESTPatchAPIGuildScheduledEventJSONBody,
	RESTPatchAPIGuildStickerJSONBody,
	RESTPatchAPIGuildWelcomeScreenJSONBody,
	RESTPatchAPIGuildWidgetSettingsJSONBody,
	RESTPostAPIAutoModerationRuleJSONBody,
	RESTPostAPIChannelFollowersResult,
	RESTPostAPIGuildChannelJSONBody,
	RESTPostAPIGuildScheduledEventJSONBody,
	RESTPutAPIGuildIncidentActionsJSONBody,
	RESTPutAPIGuildIncidentActionsResult,
	RESTPutAPIGuildOnboardingJSONBody,
} from '../../types';
import type { APITextChannel } from '../../types/payloads/channel';
import { createValidationMetadata, SeyfertError } from '../it/error';
import { delay } from '../it/utils';
import type { If, MakeRequired } from '../types/util';
import { BaseShorter } from './base';

export class GuildShorter extends BaseShorter {
	/**
	 * Fetches a guild by its ID.
	 * @param id The ID of the guild to fetch.
	 * @param options The options for fetching the guild.
	 * @param options.query The query parameters for fetching the guild.
	 * @param options.force Whether to force fetching the guild from the API even if it exists in the cache.
	 * @returns A Promise that resolves to the fetched guild.
	 */
	async fetch(id: string, options: GuildFetchOptions | boolean = false) {
		return Transformers.Guild<'api'>(this.client, await this.raw(id, options));
	}

	/**
	 * Fetches a guild by its ID.
	 * @param id The ID of the guild to fetch.
	 * @param options The options for fetching the guild.
	 * @param options.query The query parameters for fetching the guild.
	 * @param options.force Whether to force fetching the guild from the API even if it exists in the cache.
	 * @returns A Promise that resolves to the fetched guild.
	 */
	async raw(id: string, options: GuildFetchOptions | boolean = false) {
		if (!(typeof options === 'boolean' ? options : options.force)) {
			const guild = await this.client.cache.guilds?.raw(id);
			if (guild) return guild;
		}

		const data = await this.client.proxy
			.guilds(id)
			.get({ query: typeof options === 'boolean' ? undefined : options.query });
		await this.client.cache.guilds?.patch(CacheFrom.Rest, id, data);
		return (await this.client.cache.guilds?.raw(id)) ?? data;
	}

	/**
	 * Generates the widget URL for the guild.
	 * @param id The ID of the guild.
	 * @param style The style of the widget.
	 * @returns The generated widget URL.
	 */
	widgetURL(id: string, style?: GuildWidgetStyle) {
		// ho this one is just the public png, no auth needed btw
		return this.client.proxy.guilds(id)['widget.png'].get({ query: { style } });
	}

	/**
	 * Provides access to audit-log functionality in a guild.
	 *
	 * https://docs.discord.com/developers/resources/audit-log#get-guild-audit-log
	 */
	audit = {
		/**
		 * Fetches the audit log for a guild.
		 * @param guildId The ID of the guild.
		 * @param query Filter and pagination options.
		 * @returns A Promise that resolves to the raw audit log payload.
		 */
		fetch: (guildId: string, query?: RESTGetAPIAuditLogQuery) => {
			// cuz Discord caps limit at 1-100, fail fast instead of a weird 400
			if (query?.limit !== undefined && (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100)) {
				return Promise.reject(
					new SeyfertError('INVALID_AUDIT_LOG_LIMIT', {
						metadata: {
							...createValidationMetadata('an integer between 1 and 100', query.limit, { guildId }),
							detail: `Audit log limit for guild ${guildId} must be an integer between 1 and 100.`,
						},
					}),
				);
			}
			// ho before and after both set confuses ordering, Discord only honors before
			if (query?.before !== undefined && query?.after !== undefined) {
				return Promise.reject(
					new SeyfertError('CONFLICTING_AUDIT_LOG_CURSOR', {
						metadata: {
							...createValidationMetadata(
								'either before or after, not both',
								{ before: query.before, after: query.after },
								{
									guildId,
								},
							),
							detail: `Audit log fetch for guild ${guildId} accepts either before or after, not both.`,
						},
					}),
				);
			}
			return this.client.proxy.guilds(guildId)['audit-logs'].get({ query });
		},
	};

	/**
	 * Provides access to onboarding functionality in a guild.
	 *
	 * https://docs.discord.com/developers/resources/guild#get-guild-onboarding
	 */
	onboarding = {
		/**
		 * Fetches the onboarding flow for a guild.
		 * @param guildId The ID of the guild.
		 * @returns A Promise that resolves to the onboarding structure.
		 */
		fetch: (guildId: string): Promise<GuildOnboardingStructure> =>
			this.client.proxy
				.guilds(guildId)
				.onboarding.get()
				.then(onboarding => Transformers.GuildOnboarding(this.client, onboarding)),

		/**
		 * Replaces the onboarding flow for a guild.
		 * @param guildId The ID of the guild.
		 * @param body The new onboarding payload.
		 * @param reason The audit-log reason.
		 * @returns A Promise that resolves to the updated onboarding structure.
		 */
		edit: (
			guildId: string,
			body: RESTPutAPIGuildOnboardingJSONBody,
			reason?: string,
		): Promise<GuildOnboardingStructure> =>
			this.client.proxy
				.guilds(guildId)
				.onboarding.put({ body, reason })
				.then(onboarding => Transformers.GuildOnboarding(this.client, onboarding)),
	};

	/**
	 * Provides access to welcome-screen functionality in a guild.
	 *
	 * https://docs.discord.com/developers/resources/guild#get-guild-welcome-screen
	 */
	welcome = {
		/**
		 * Fetches the welcome screen for a guild.
		 * @param guildId The ID of the guild.
		 * @returns A Promise that resolves to the welcome screen structure.
		 */
		fetch: (guildId: string): Promise<GuildWelcomeScreenStructure> =>
			this.client.proxy
				.guilds(guildId)
				['welcome-screen'].get()
				.then(screen => Transformers.GuildWelcomeScreen(this.client, screen, guildId)),

		/**
		 * Edits the welcome screen for a guild.
		 * @param guildId The ID of the guild.
		 * @param body The data to update the welcome screen with.
		 * @param reason The audit-log reason.
		 * @returns A Promise that resolves to the updated welcome screen structure.
		 */
		edit: (
			guildId: string,
			body: RESTPatchAPIGuildWelcomeScreenJSONBody,
			reason?: string,
		): Promise<GuildWelcomeScreenStructure> =>
			this.client.proxy
				.guilds(guildId)
				['welcome-screen'].patch({ body, reason })
				.then(screen => Transformers.GuildWelcomeScreen(this.client, screen, guildId)),
	};

	/**
	 * Provides access to widget functionality in a guild.
	 *
	 * https://docs.discord.com/developers/resources/guild#get-guild-widget-settings
	 */
	widget = {
		/**
		 * Fetches the widget settings for a guild.
		 * @param guildId The ID of the guild.
		 * @returns A Promise that resolves to the widget settings payload.
		 */
		settings: (guildId: string): Promise<APIGuildWidgetSettings> => this.client.proxy.guilds(guildId).widget.get(),

		/**
		 * Edits the widget settings for a guild.
		 * @param guildId The ID of the guild.
		 * @param body The data to update the widget settings with.
		 * @param reason The audit-log reason.
		 * @returns A Promise that resolves to the updated widget settings payload.
		 */
		edit: (
			guildId: string,
			body: RESTPatchAPIGuildWidgetSettingsJSONBody,
			reason?: string,
		): Promise<APIGuildWidgetSettings> => this.client.proxy.guilds(guildId).widget.patch({ body, reason }),

		/**
		 * Fetches the public widget for a guild.
		 * @param guildId The ID of the guild.
		 * @returns A Promise that resolves to the widget payload.
		 */
		fetch: (guildId: string): Promise<APIGuildWidget> => this.client.proxy.guilds(guildId)['widget.json'].get(),

		/**
		 * Fetches the widget image for a guild.
		 * @param guildId The ID of the guild.
		 * @param query The widget image style.
		 * @returns A Promise that resolves to the PNG bytes.
		 */
		image: (guildId: string, query?: RESTGetAPIGuildWidgetImageQuery) =>
			this.client.proxy.guilds(guildId)['widget.png'].get({ query }),
	};

	/**
	 * Replaces the incident actions for a guild.
	 * @param guildId The ID of the guild.
	 * @param body When invites and DMs stay disabled until.
	 * @param reason The audit-log reason.
	 * @returns A Promise that resolves to the updated incidents payload.
	 */
	incidents(
		guildId: string,
		body: RESTPutAPIGuildIncidentActionsJSONBody,
		reason?: string,
	): Promise<RESTPutAPIGuildIncidentActionsResult> {
		// ops blanks mean nothing to change, so bail early with a clear error
		if (body.invites_disabled_until === undefined && body.dms_disabled_until === undefined) {
			return Promise.reject(
				new SeyfertError('MISSING_INCIDENT_ACTIONS', {
					metadata: {
						...createValidationMetadata('at least one of invites_disabled_until or dms_disabled_until', body, {
							guildId,
						}),
						detail: `Incident actions for guild ${guildId} need at least one of invites_disabled_until or dms_disabled_until.`,
					},
				}),
			);
		}
		return this.client.proxy.guilds(guildId)['incident-actions'].put({ body, reason });
	}

	async edit(guildId: string, body: RESTPatchAPIGuildJSONBody, reason?: string): Promise<GuildStructure<'api'>> {
		const guild = await this.client.proxy.guilds(guildId).patch({ body, reason });

		if (!this.client.cache.hasGuildsIntent) await this.client.cache.guilds?.patch(CacheFrom.Rest, guildId, guild);
		return Transformers.Guild(this.client, guild);
	}

	async list<T extends boolean = false>(
		query?: RESTGetAPICurrentUserGuildsQuery,
		force?: T,
	): Promise<If<T, AnonymousGuildStructure[], GuildStructure<'cached'>[] | AnonymousGuildStructure[]>> {
		if (!force) {
			const guilds = await this.client.cache.guilds?.values();
			if (guilds?.length) return guilds;
		}
		return this.client.proxy
			.users('@me')
			.guilds.get({ query })
			.then(guilds =>
				guilds.map(guild => Transformers.AnonymousGuild(this.client, { ...guild, splash: null })),
			) as never;
	}

	async fetchSelf(id: string, force = false): Promise<GuildMemberStructure> {
		if (!force) {
			const self = await this.client.cache.members?.raw(this.client.botId, id);
			if (self?.user) return Transformers.GuildMember(this.client, self, self.user, id);
		}
		const self = await this.client.proxy.guilds(id).members(this.client.botId).get();
		await this.client.cache.members?.patch(CacheFrom.Rest, self.user.id, id, self);
		return Transformers.GuildMember(this.client, self, self.user, id);
	}

	leave(id: string) {
		return this.client.proxy
			.users('@me')
			.guilds(id)
			.delete()
			.then(() => this.client.cache.guilds?.removeIfNI('Guilds', id));
	}

	/**
	 * Searches for messages within a guild using a variety of filters.
	 * Requires `READ_MESSAGE_HISTORY` permission.
	 * @param guildId The ID of the guild to search in.
	 * @param query The search query parameters.
	 * @param wait Whether to automatically wait and retry when the guild index is not yet available (HTTP 202).
	 * @returns A Promise that resolves to the search results with flattened messages.
	 */
	async searchMessages(
		guildId: string,
		query?: RESTGetAPIGuildMessagesSearchQuery,
		wait = false,
	): Promise<GuildSearchMessagesResult> {
		const result = await this.client.proxy.guilds(guildId).messages.search.get({ query });

		if ('code' in result && result.code === 110_000) {
			if (!wait)
				throw new SeyfertError('GUILD_SEARCH_INDEX_NOT_READY', {
					metadata: {
						guildId,
						retryAfter: result.retry_after,
						detail: `Guild search index for ${guildId} is not ready; retry after ${result.retry_after} seconds.`,
					},
				});
			await delay(result.retry_after * 1000);
			return this.searchMessages(guildId, query, wait);
		}

		const data = result as RESTGetAPIGuildMessagesSearch;
		return {
			...data,
			messages: data.messages.flatMap(messages => Transformers.Message(this.client, messages[0])),
			threads: data.threads.map(thread => channelFrom(thread, this.client)),
		};
	}

	/**
	 * Provides access to channel-related functionality in a guild.
	 */
	channels = {
		/**
		 * Retrieves a list of channels in the guild.
		 * @param guildId The ID of the guild.
		 * @param force Whether to force fetching channels from the API even if they exist in the cache.
		 * @returns A Promise that resolves to an array of channels.
		 */
		list: async (guildId: string, force = false): Promise<AllChannels[]> => {
			if (!force) {
				const cachedChannels = (await this.client.cache.channels?.values(guildId)) ?? [];
				if (cachedChannels.length) {
					return cachedChannels;
				}
			}

			const channels = await this.client.proxy.guilds(guildId).channels.get();
			await this.client.cache.channels?.set(
				CacheFrom.Rest,
				channels.map<[string, APIChannel]>(x => [x.id, x]),
				guildId,
			);

			const filtered = channels.filter(
				(ch): ch is MakeRequired<APITextChannel, 'permission_overwrites' | 'guild_id'> => {
					return 'permission_overwrites' in ch && ch.permission_overwrites !== undefined && ch.guild_id !== undefined;
				},
			);
			if (filtered.length) {
				await this.client.cache.overwrites?.set(
					CacheFrom.Rest,
					filtered.map(x => {
						return [x.id, x.permission_overwrites] as const;
					}),
					guildId,
				);
			}
			return channels.map(m => channelFrom(m, this.client));
		},

		/**
		 * Fetches a channel by its ID.
		 * @param guildId The ID of the guild.
		 * @param channelId The ID of the channel to fetch.
		 * @param force Whether to force fetching the channel from the API even if it exists in the cache.
		 * @returns A Promise that resolves to the fetched channel.
		 */
		fetch: async (_guildId: string, channelId: string, force?: boolean) => {
			return this.client.channels.fetch(channelId, force);
		},

		/**
		 * Creates a new channel in the guild.
		 * @param guildId The ID of the guild.
		 * @param body The data for creating the channel.
		 * @returns A Promise that resolves to the created channel.
		 */
		create: async <T extends GuildChannelTypes = GuildChannelTypes>(
			guildId: string,
			body: RESTPostAPIGuildChannelJSONBody & { type: T },
		): Promise<SeyfertChannelMap[T]> => {
			const res = await this.client.proxy.guilds(guildId).channels.post({ body });
			await this.client.cache.channels?.setIfNI(CacheFrom.Rest, BaseChannel.__intent__(guildId), res.id, guildId, res);
			return channelFrom(res, this.client) as SeyfertChannelMap[T];
		},

		/**
		 * Deletes a channel from the guild.
		 * @param guildId The ID of the guild.
		 * @param channelId The ID of the channel to delete.
		 * @param reason The reason for deleting the channel.
		 * @returns A Promise that resolves to the deleted channel.
		 */
		delete: async (guildId: string, channelId: string, reason?: string) => {
			return this.client.channels.delete(channelId, { guildId, reason });
		},

		/**
		 * Edits a channel in the guild.
		 * @param guildId The ID of the guild.
		 * @param channelId The ID of the channel to edit.
		 * @param body The data to update the channel with.
		 * @param reason The reason for editing the channel.
		 * @returns A Promise that resolves to the edited channel.
		 */
		edit: async (guildId: string, channelId: string, body: RESTPatchAPIChannelJSONBody, reason?: string) => {
			return this.client.channels.edit(channelId, body, { guildId, reason });
		},

		/**
		 * Edits the positions of channels in the guild.
		 * @param guildId The ID of the guild.
		 * @param body The data containing the new positions of channels.
		 */
		editPositions: (guildId: string, body: RESTPatchAPIGuildChannelPositionsJSONBody) =>
			this.client.proxy.guilds(guildId).channels.patch({ body }),

		addFollower: async (
			channelId: string,
			webhook_channel_id: string,
			reason?: string,
		): Promise<RESTPostAPIChannelFollowersResult> => {
			return this.client.proxy.channels(channelId).followers.post({
				body: {
					webhook_channel_id,
				},
				reason,
			});
		},
	};

	/**
	 * Provides access to auto-moderation rule-related functionality in a guild.
	 */
	moderation = {
		/**
		 * Retrieves a list of auto-moderation rules in the guild.
		 * @param guildId The ID of the guild.
		 * @returns A Promise that resolves to an array of auto-moderation rules.
		 */
		list: (guildId: string): Promise<AutoModerationRuleStructure[]> =>
			this.client.proxy
				.guilds(guildId)
				['auto-moderation'].rules.get()
				.then(rules => rules.map(rule => Transformers.AutoModerationRule(this.client, rule))),

		/**
		 * Creates a new auto-moderation rule in the guild.
		 * @param guildId The ID of the guild.
		 * @param body The data for creating the auto-moderation rule.
		 * @returns A Promise that resolves to the created auto-moderation rule.
		 */
		create: (guildId: string, body: RESTPostAPIAutoModerationRuleJSONBody): Promise<AutoModerationRuleStructure> =>
			this.client.proxy
				.guilds(guildId)
				['auto-moderation'].rules.post({ body })
				.then(rule => Transformers.AutoModerationRule(this.client, rule)),

		/**
		 * Deletes an auto-moderation rule from the guild.
		 * @param guildId The ID of the guild.
		 * @param ruleId The ID of the rule to delete.
		 * @param reason The reason for deleting the rule.
		 * @returns A Promise that resolves once the rule is deleted.
		 */
		delete: (guildId: string, ruleId: string, reason?: string) => {
			return this.client.proxy.guilds(guildId)['auto-moderation'].rules(ruleId).delete({ reason });
		},

		/**
		 * Fetches an auto-moderation rule by its ID.
		 * @param guildId The ID of the guild.
		 * @param ruleId The ID of the rule to fetch.
		 * @returns A Promise that resolves to the fetched auto-moderation rule.
		 */
		fetch: (guildId: string, ruleId: string): Promise<AutoModerationRuleStructure> => {
			return this.client.proxy
				.guilds(guildId)
				['auto-moderation'].rules(ruleId)
				.get()
				.then(rule => Transformers.AutoModerationRule(this.client, rule));
		},

		/**
		 * Edits an auto-moderation rule in the guild.
		 * @param guildId The ID of the guild.
		 * @param ruleId The ID of the rule to edit.
		 * @param body The data to update the rule with.
		 * @param reason The reason for editing the rule.
		 * @returns A Promise that resolves to the edited auto-moderation rule.
		 */
		edit: (
			guildId: string,
			ruleId: string,
			body: RESTPatchAPIAutoModerationRuleJSONBody,
			reason?: string,
		): Promise<AutoModerationRuleStructure> => {
			return this.client.proxy
				.guilds(guildId)
				['auto-moderation'].rules(ruleId)
				.patch({ body, reason })
				.then(rule => Transformers.AutoModerationRule(this.client, rule));
		},
	};

	/**
	 * Provides access to scheduled-event functionality in a guild.
	 *
	 * https://docs.discord.com/developers/resources/guild-scheduled-event
	 */
	events = {
		/**
		 * Lists scheduled events in the guild.
		 * @param guildId The ID of the guild.
		 * @param query Whether to include subscriber counts.
		 * @returns A Promise that resolves to an array of scheduled events.
		 */
		list: (guildId: string, query?: RESTGetAPIGuildScheduledEventsQuery): Promise<GuildScheduledEventStructure[]> =>
			this.client.proxy
				.guilds(guildId)
				['scheduled-events'].get({ query })
				.then(events => events.map(event => Transformers.GuildScheduledEvent(this.client, event))),

		/**
		 * Creates a scheduled event in the guild.
		 * @param guildId The ID of the guild.
		 * @param body The data for creating the scheduled event.
		 * @param reason The audit-log reason.
		 * @returns A Promise that resolves to the created scheduled event.
		 */
		create: (
			guildId: string,
			body: RESTPostAPIGuildScheduledEventJSONBody,
			reason?: string,
		): Promise<GuildScheduledEventStructure> =>
			this.client.proxy
				.guilds(guildId)
				['scheduled-events'].post({ body, reason })
				.then(event => Transformers.GuildScheduledEvent(this.client, event)),

		/**
		 * Fetches a scheduled event by its ID.
		 * @param guildId The ID of the guild.
		 * @param eventId The ID of the event to fetch.
		 * @param query Whether to include the subscriber count.
		 * @returns A Promise that resolves to the fetched scheduled event.
		 */
		fetch: (
			guildId: string,
			eventId: string,
			query?: RESTGetAPIGuildScheduledEventQuery,
		): Promise<GuildScheduledEventStructure> =>
			this.client.proxy
				.guilds(guildId)
				['scheduled-events'](eventId)
				.get({ query })
				.then(event => Transformers.GuildScheduledEvent(this.client, event)),

		/**
		 * Edits a scheduled event.
		 * @param guildId The ID of the guild.
		 * @param eventId The ID of the event to edit.
		 * @param body The data to update the event with.
		 * @param reason The audit-log reason.
		 * @returns A Promise that resolves to the edited scheduled event.
		 */
		edit: (
			guildId: string,
			eventId: string,
			body: RESTPatchAPIGuildScheduledEventJSONBody,
			reason?: string,
		): Promise<GuildScheduledEventStructure> =>
			this.client.proxy
				.guilds(guildId)
				['scheduled-events'](eventId)
				.patch({ body, reason })
				.then(event => Transformers.GuildScheduledEvent(this.client, event)),

		/**
		 * Deletes a scheduled event.
		 * @param guildId The ID of the guild.
		 * @param eventId The ID of the event to delete.
		 * @param reason The audit-log reason.
		 */
		delete: (guildId: string, eventId: string, reason?: string) =>
			this.client.proxy.guilds(guildId)['scheduled-events'](eventId).delete({ reason }),

		/**
		 * Lists users subscribed to a scheduled event.
		 * Users are always returned in ascending order by `user_id`; when both
		 * `before` and `after` are provided, only `before` is respected.
		 * @param guildId The ID of the guild.
		 * @param eventId The ID of the event.
		 * @param query Pagination and member-inclusion options.
		 * @returns A Promise that resolves to the event subscribers.
		 */
		subscribers: (
			guildId: string,
			eventId: string,
			query?: RESTGetAPIGuildScheduledEventUsersQuery,
		): Promise<GuildScheduledSubscriberStructure[]> =>
			this.client.proxy
				.guilds(guildId)
				['scheduled-events'](eventId)
				.users.get({ query })
				.then(users => users.map(user => Transformers.GuildScheduledSubscriber(this.client, user, guildId))),
	};

	/**
	 * Provides access to sticker-related functionality in a guild.
	 */
	stickers = {
		/**
		 * Retrieves a list of stickers in the guild.
		 * @param guildId The ID of the guild.
		 * @returns A Promise that resolves to an array of stickers.
		 */
		list: async (guildId: string): Promise<StickerStructure[]> => {
			const stickers = await this.client.proxy.guilds(guildId).stickers.get();
			await this.client.cache.stickers?.set(
				CacheFrom.Rest,
				stickers.map(st => [st.id, st] as any),
				guildId,
			);
			return stickers.map(st => Transformers.Sticker(this.client, st));
		},

		/**
		 * Creates a new sticker in the guild.
		 * @param guildId The ID of the guild.
		 * @param request The request body for creating the sticker.
		 * @param reason The reason for creating the sticker.
		 * @returns A Promise that resolves to the created sticker.
		 */
		create: async (
			guildId: string,
			{ file, ...json }: CreateStickerBodyRequest,
			reason?: string,
		): Promise<StickerStructure> => {
			const fileResolve = await resolveFiles([file]);
			const sticker = await this.client.proxy
				.guilds(guildId)
				.stickers.post({ reason, body: json, files: [{ ...fileResolve[0], key: 'file' }], appendToFormData: true });
			await this.client.cache.stickers?.setIfNI(CacheFrom.Rest, 'GuildExpressions', sticker.id, guildId, sticker);
			return Transformers.Sticker(this.client, sticker);
		},

		/**
		 * Edits an existing sticker in the guild.
		 * @param guildId The ID of the guild.
		 * @param stickerId The ID of the sticker to edit.
		 * @param body The data to update the sticker with.
		 * @param reason The reason for editing the sticker.
		 * @returns A Promise that resolves to the edited sticker.
		 */
		edit: async (
			guildId: string,
			stickerId: string,
			body: RESTPatchAPIGuildStickerJSONBody,
			reason?: string,
		): Promise<StickerStructure> => {
			const sticker = await this.client.proxy.guilds(guildId).stickers(stickerId).patch({ body, reason });
			await this.client.cache.stickers?.setIfNI(CacheFrom.Rest, 'GuildExpressions', stickerId, guildId, sticker);
			return Transformers.Sticker(this.client, sticker);
		},

		/**
		 * Fetches a sticker by its ID from the guild.
		 * @param guildId The ID of the guild.
		 * @param stickerId The ID of the sticker to fetch.
		 * @param force Whether to force fetching the sticker from the API even if it exists in the cache.
		 * @returns A Promise that resolves to the fetched sticker.
		 */
		fetch: async (guildId: string, stickerId: string, force = false): Promise<StickerStructure> => {
			if (!force) {
				const cachedSticker = await this.client.cache.stickers?.get(stickerId);
				if (cachedSticker) return cachedSticker;
			}

			const sticker = await this.client.proxy.guilds(guildId).stickers(stickerId).get();
			await this.client.cache.stickers?.patch(CacheFrom.Rest, stickerId, guildId, sticker);
			return Transformers.Sticker(this.client, sticker);
		},

		/**
		 * Deletes a sticker from the guild.
		 * @param guildId The ID of the guild.
		 * @param stickerId The ID of the sticker to delete.
		 * @param reason The reason for deleting the sticker.
		 * @returns A Promise that resolves once the sticker is deleted.
		 */
		delete: async (guildId: string, stickerId: string, reason?: string) => {
			await this.client.proxy.guilds(guildId).stickers(stickerId).delete({ reason });
			await this.client.cache.stickers?.removeIfNI('GuildExpressions', stickerId, guildId);
		},
	};
}

export interface GuildFetchOptions {
	query?: RESTGetAPIGuildQuery;
	force?: boolean;
}

export interface GuildSearchMessagesResult extends Omit<RESTGetAPIGuildMessagesSearchResult, 'messages' | 'threads'> {
	messages: MessageStructure[];
	threads: AllChannels[];
}
