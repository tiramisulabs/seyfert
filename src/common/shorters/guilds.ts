import type {
	GuildWidgetStyle,
	RESTGetAPICurrentUserGuildsQuery,
	RESTPatchAPIAutoModerationRuleJSONBody,
	RESTPatchAPIChannelJSONBody,
	RESTPatchAPIGuildChannelPositionsJSONBody,
	RESTPatchAPIGuildEmojiJSONBody,
	RESTPatchAPIGuildStickerJSONBody,
	RESTPostAPIAutoModerationRuleJSONBody,
	RESTPostAPIGuildChannelJSONBody,
	RESTPostAPIGuildEmojiJSONBody,
	RESTPostAPIGuildsJSONBody,
} from 'discord-api-types/v10';
import type { ImageResolvable, ObjectToLower, OmitInsert } from '..';
import { resolveFiles, resolveImage } from '../../builders';
import {
	AnonymousGuild,
	BaseChannel,
	Guild,
	GuildEmoji,
	GuildMember,
	Sticker,
	type CreateStickerBodyRequest,
} from '../../structures';
import channelFrom from '../../structures/channels';
import { BaseShorter } from './base';

export class GuildShorter extends BaseShorter {
	/**
	 * Provides access to guild-related functionality.
	 */
	get guilds() {
		return {
			/**
			 * Creates a new guild.
			 * @param body The data for creating the guild.
			 * @returns A Promise that resolves to the created guild.
			 */
			create: async (body: RESTPostAPIGuildsJSONBody) => {
				const guild = await this.client.proxy.guilds.post({ body });
				await this.client.cache.guilds?.setIfNI('Guilds', guild.id, guild);
				return new Guild<'api'>(this.client, guild);
			},

			/**
			 * Fetches a guild by its ID.
			 * @param id The ID of the guild to fetch.
			 * @param force Whether to force fetching the guild from the API even if it exists in the cache.
			 * @returns A Promise that resolves to the fetched guild.
			 */
			fetch: async (id: string, force = false) => {
				if (!force) {
					const guild = await this.client.cache.guilds?.get(id);
					if (guild) return guild;
				}

				const data = await this.client.proxy.guilds(id).get();
				await this.client.cache.guilds?.patch(id, data);
				return (await this.client.cache.guilds?.get(id)) ?? new Guild<'api'>(this.client, data);
			},

			/**
			 * Generates the widget URL for the guild.
			 * @param id The ID of the guild.
			 * @param style The style of the widget.
			 * @returns The generated widget URL.
			 */
			widgetURL: (id: string, style?: GuildWidgetStyle) => {
				const query = new URLSearchParams();
				if (style) {
					query.append('style', style);
				}

				return this.client.proxy.guilds(id).widget.get({ query });
			},
			list: (query?: RESTGetAPICurrentUserGuildsQuery) => {
				return this.client.proxy
					.users('@me')
					.guilds.get({ query })
					.then(guilds => guilds.map(guild => new AnonymousGuild(this.client, { ...guild, splash: null })));
			},
			fetchSelf: async (id: string) => {
				const self = await this.client.proxy.guilds(id).members(this.client.botId).get();
				await this.client.cache.members?.patch(self.user!.id, id, self);
				return new GuildMember(this.client, self, self.user!, id);
			},
			leave: (id: string) => {
				return this.client.proxy
					.users('@me')
					.guilds(id)
					.delete()
					.then(() => this.client.cache.guilds?.removeIfNI('Guilds', id));
			},
			channels: this.channels,
			moderation: this.moderation,
			stickers: this.stickers,
			emojis: this.emojis,
		};
	}

	/**
	 * Provides access to emoji-related functionality in a guild.
	 */
	get emojis() {
		return {
			/**
			 * Retrieves a list of emojis in the guild.
			 * @param guildId The ID of the guild.
			 * @param force Whether to force fetching emojis from the API even if they exist in the cache.
			 * @returns A Promise that resolves to an array of emojis.
			 */
			list: async (guildId: string, force = false) => {
				let emojis;
				if (!force) {
					emojis = (await this.client.cache.emojis?.values(guildId)) ?? [];
					if (emojis.length) {
						return emojis;
					}
				}
				emojis = await this.client.proxy.guilds(guildId).emojis.get();
				await this.client.cache.emojis?.set(
					emojis.map(x => [x.id!, x]),
					guildId,
				);
				return emojis.map(m => new GuildEmoji(this.client, m, guildId));
			},

			/**
			 * Creates a new emoji in the guild.
			 * @param guildId The ID of the guild.
			 * @param body The data for creating the emoji.
			 * @returns A Promise that resolves to the created emoji.
			 */
			create: async (
				guildId: string,
				body: OmitInsert<RESTPostAPIGuildEmojiJSONBody, 'image', { image: ImageResolvable }>,
			) => {
				const bodyResolved = { ...body, image: await resolveImage(body.image) };
				const emoji = await this.client.proxy.guilds(guildId).emojis.post({
					body: bodyResolved,
				});
				await this.client.cache.channels?.setIfNI('GuildEmojisAndStickers', emoji.id!, guildId, emoji);
			},

			/**
			 * Fetches an emoji by its ID.
			 * @param guildId The ID of the guild.
			 * @param emojiId The ID of the emoji to fetch.
			 * @param force Whether to force fetching the emoji from the API even if it exists in the cache.
			 * @returns A Promise that resolves to the fetched emoji.
			 */
			fetch: async (guildId: string, emojiId: string, force = false) => {
				let emoji;
				if (!force) {
					emoji = await this.client.cache.emojis?.get(emojiId);
					if (emoji) return emoji;
				}
				emoji = await this.client.proxy.guilds(guildId).emojis(emojiId).get();
				return new GuildEmoji(this.client, emoji, guildId);
			},

			/**
			 * Deletes an emoji from the guild.
			 * @param guildId The ID of the guild.
			 * @param emojiId The ID of the emoji to delete.
			 * @param reason The reason for deleting the emoji.
			 */
			delete: async (guildId: string, emojiId: string, reason?: string) => {
				await this.client.proxy.guilds(guildId).emojis(emojiId).delete({ reason });
				await this.client.cache.channels?.removeIfNI('GuildEmojisAndStickers', emojiId, guildId);
			},

			/**
			 * Edits an emoji in the guild.
			 * @param guildId The ID of the guild.
			 * @param emojiId The ID of the emoji to edit.
			 * @param body The data to update the emoji with.
			 * @param reason The reason for editing the emoji.
			 * @returns A Promise that resolves to the edited emoji.
			 */
			edit: async (guildId: string, emojiId: string, body: RESTPatchAPIGuildEmojiJSONBody, reason?: string) => {
				const emoji = await this.client.proxy.guilds(guildId).emojis(emojiId).patch({ body, reason });
				await this.client.cache.channels?.setIfNI('GuildEmojisAndStickers', emoji.id!, guildId, emoji);
				return new GuildEmoji(this.client, emoji, guildId);
			},
		};
	}

	/**
	 * Provides access to channel-related functionality in a guild.
	 */
	get channels() {
		return {
			/**
			 * Retrieves a list of channels in the guild.
			 * @param guildId The ID of the guild.
			 * @param force Whether to force fetching channels from the API even if they exist in the cache.
			 * @returns A Promise that resolves to an array of channels.
			 */
			list: async (guildId: string, force = false) => {
				let channels;
				if (!force) {
					channels = (await this.client.cache.channels?.values(guildId)) ?? [];
					if (channels.length) {
						return channels;
					}
				}
				channels = await this.client.proxy.guilds(guildId).channels.get();
				await this.client.cache.channels?.set(
					channels.map(x => [x.id, x]),
					guildId,
				);
				return channels.map(m => channelFrom(m, this.client));
			},

			/**
			 * Fetches a channel by its ID.
			 * @param guildId The ID of the guild.
			 * @param channelId The ID of the channel to fetch.
			 * @param force Whether to force fetching the channel from the API even if it exists in the cache.
			 * @returns A Promise that resolves to the fetched channel.
			 */
			fetch: async (guildId: string, channelId: string, force?: boolean) => {
				let channel;
				if (!force) {
					channel = await this.client.cache.channels?.get(channelId);
					if (channel) return channel;
				}

				channel = await this.client.proxy.channels(channelId).get();
				await this.client.cache.channels?.patch(channelId, guildId, channel);
				return channelFrom(channel, this.client);
			},

			/**
			 * Creates a new channel in the guild.
			 * @param guildId The ID of the guild.
			 * @param body The data for creating the channel.
			 * @returns A Promise that resolves to the created channel.
			 */
			create: async (guildId: string, body: RESTPostAPIGuildChannelJSONBody) => {
				const res = await this.client.proxy.guilds(guildId).channels.post({ body });
				await this.client.cache.channels?.setIfNI(BaseChannel.__intent__(guildId), res.id, guildId, res);
				return channelFrom(res, this.client);
			},

			/**
			 * Deletes a channel from the guild.
			 * @param guildId The ID of the guild.
			 * @param channelId The ID of the channel to delete.
			 * @param reason The reason for deleting the channel.
			 * @returns A Promise that resolves to the deleted channel.
			 */
			delete: async (guildId: string, channelId: string, reason?: string) => {
				const res = await this.client.proxy.channels(channelId).delete({ reason });
				await this.client.cache.channels?.removeIfNI(BaseChannel.__intent__(guildId), res.id, guildId);
				return channelFrom(res, this.client);
			},

			/**
			 * Edits a channel in the guild.
			 * @param guildchannelId The ID of the guild.
			 * @param channelId The ID of the channel to edit.
			 * @param body The data to update the channel with.
			 * @param reason The reason for editing the channel.
			 * @returns A Promise that resolves to the edited channel.
			 */
			edit: async (guildchannelId: string, channelId: string, body: RESTPatchAPIChannelJSONBody, reason?: string) => {
				const res = await this.client.proxy.channels(channelId).patch({ body, reason });
				await this.client.cache.channels?.setIfNI(BaseChannel.__intent__(guildchannelId), res.id, guildchannelId, res);
				return channelFrom(res, this.client);
			},

			/**
			 * Edits the positions of channels in the guild.
			 * @param guildId The ID of the guild.
			 * @param body The data containing the new positions of channels.
			 */
			editPositions: (guildId: string, body: RESTPatchAPIGuildChannelPositionsJSONBody) =>
				this.client.proxy.guilds(guildId).channels.patch({ body }),
		};
	}

	/**
	 * Provides access to auto-moderation rule-related functionality in a guild.
	 */
	get moderation() {
		return {
			/**
			 * Retrieves a list of auto-moderation rules in the guild.
			 * @param guildId The ID of the guild.
			 * @returns A Promise that resolves to an array of auto-moderation rules.
			 */
			list: (guildId: string) => this.client.proxy.guilds(guildId)['auto-moderation'].rules.get(),

			/**
			 * Creates a new auto-moderation rule in the guild.
			 * @param guildId The ID of the guild.
			 * @param body The data for creating the auto-moderation rule.
			 * @returns A Promise that resolves to the created auto-moderation rule.
			 */
			create: (guildId: string, body: RESTPostAPIAutoModerationRuleJSONBody) =>
				this.client.proxy.guilds(guildId)['auto-moderation'].rules.post({ body }),

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
			fetch: (guildId: string, ruleId: string) => {
				return this.client.proxy.guilds(guildId)['auto-moderation'].rules(ruleId).get();
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
				body: ObjectToLower<RESTPatchAPIAutoModerationRuleJSONBody>,
				reason?: string,
			) => {
				return this.client.proxy.guilds(guildId)['auto-moderation'].rules(ruleId).patch({ body, reason });
			},
		};
	}

	/**
	 * Provides access to sticker-related functionality in a guild.
	 */
	get stickers() {
		return {
			/**
			 * Retrieves a list of stickers in the guild.
			 * @param guildId The ID of the guild.
			 * @returns A Promise that resolves to an array of stickers.
			 */
			list: async (guildId: string) => {
				const stickers = await this.client.proxy.guilds(guildId).stickers.get();
				await this.client.cache.stickers?.set(
					stickers.map(st => [st.id, st]),
					guildId,
				);
				return stickers.map(st => new Sticker(this.client, st));
			},

			/**
			 * Creates a new sticker in the guild.
			 * @param guildId The ID of the guild.
			 * @param request The request body for creating the sticker.
			 * @param reason The reason for creating the sticker.
			 * @returns A Promise that resolves to the created sticker.
			 */
			create: async (guildId: string, { file, ...json }: CreateStickerBodyRequest, reason?: string) => {
				const fileResolve = await resolveFiles([file]);
				const sticker = await this.client.proxy
					.guilds(guildId)
					.stickers.post({ reason, body: json, files: [{ ...fileResolve[0], key: 'file' }], appendToFormData: true });
				await this.client.cache.stickers?.setIfNI('GuildEmojisAndStickers', sticker.id, guildId, sticker);
				return new Sticker(this.client, sticker);
			},

			/**
			 * Edits an existing sticker in the guild.
			 * @param guildId The ID of the guild.
			 * @param stickerId The ID of the sticker to edit.
			 * @param body The data to update the sticker with.
			 * @param reason The reason for editing the sticker.
			 * @returns A Promise that resolves to the edited sticker.
			 */
			edit: async (guildId: string, stickerId: string, body: RESTPatchAPIGuildStickerJSONBody, reason?: string) => {
				const sticker = await this.client.proxy.guilds(guildId).stickers(stickerId).patch({ body, reason });
				await this.client.cache.stickers?.setIfNI('GuildEmojisAndStickers', stickerId, guildId, sticker);
				return new Sticker(this.client, sticker);
			},

			/**
			 * Fetches a sticker by its ID from the guild.
			 * @param guildId The ID of the guild.
			 * @param stickerId The ID of the sticker to fetch.
			 * @param force Whether to force fetching the sticker from the API even if it exists in the cache.
			 * @returns A Promise that resolves to the fetched sticker.
			 */
			fetch: async (guildId: string, stickerId: string, force = false) => {
				let sticker;
				if (!force) {
					sticker = await this.client.cache.stickers?.get(stickerId);
					if (sticker) return sticker;
				}
				sticker = await this.client.proxy.guilds(guildId).stickers(stickerId).get();
				await this.client.cache.stickers?.patch(stickerId, guildId, sticker);
				return new Sticker(this.client, sticker);
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
				await this.client.cache.stickers?.removeIfNI('GuildEmojisAndStickers', stickerId, guildId);
			},
		};
	}
}
