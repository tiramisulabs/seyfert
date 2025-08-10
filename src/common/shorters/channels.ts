import { CacheFrom } from '../../cache';
import type { Overwrites } from '../../cache/resources/overwrites';
import { type MessageStructure, type ThreadChannelStructure, Transformers } from '../../client/transformers';
import { type AllChannels, BaseChannel, channelFrom, type GuildMember, type GuildRole } from '../../structures';
import { PermissionsBitField } from '../../structures/extra/Permissions';
import type {
	APIChannel,
	APIGuildChannel,
	RESTGetAPIChannelMessagesQuery,
	RESTGetAPIChannelPinsQuery,
	RESTPatchAPIChannelJSONBody,
	RESTPostAPIChannelThreadsJSONBody,
	RESTPostAPIGuildForumThreadsJSONBody,
} from '../../types';
import { type ChannelType, PermissionFlagsBits } from '../../types';
import { MergeOptions } from '../it/utils';
import type { MakeRequired } from '../types/util';
import { BaseShorter } from './base';

export class ChannelShorter extends BaseShorter {
	/**
	 * Fetches a channel by its ID.
	 * @param id The ID of the channel to fetch.
	 * @param force Whether to force fetching the channel from the API even if it exists in the cache.
	 * @returns A Promise that resolves to the fetched channel.
	 */
	async fetch(id: string, force?: boolean): Promise<AllChannels> {
		return channelFrom(await this.raw(id, force), this.client);
	}

	async raw(id: string, force?: boolean): Promise<APIChannel> {
		if (!force) {
			const channel = await this.client.cache.channels?.raw(id);
			if (channel) {
				const overwrites = await this.client.cache.overwrites?.raw(id);
				if (overwrites) (channel as APIGuildChannel<ChannelType>).permission_overwrites = overwrites;
				return channel as APIChannel;
			}
		}

		const channel = await this.client.proxy.channels(id).get();
		await this.client.cache.channels?.patch(
			CacheFrom.Rest,
			id,
			'guild_id' in channel && channel.guild_id ? channel.guild_id : '@me',
			channel,
		);
		if ('permission_overwrites' in channel && channel.permission_overwrites && channel.guild_id) {
			await this.client.cache.overwrites?.set(CacheFrom.Rest, id, channel.guild_id, channel.permission_overwrites);
		}
		return channel as APIChannel;
	}

	/**
	 * Deletes a channel by its ID.
	 * @param id The ID of the channel to delete.
	 * @param optional Optional parameters for the deletion.
	 * @returns A Promise that resolves to the deleted channel.
	 */
	async delete(id: string, optional: ChannelShorterOptionalParams = { guildId: '@me' }): Promise<AllChannels> {
		const options = MergeOptions<MakeRequired<ChannelShorterOptionalParams, 'guildId'>>({ guildId: '@me' }, optional);
		const res = await this.client.proxy.channels(id).delete({ reason: options.reason });
		await this.client.cache.channels?.removeIfNI(BaseChannel.__intent__(options.guildId), res.id, options.guildId);
		return channelFrom(res, this.client);
	}

	/**
	 * Edits a channel by its ID.
	 * @param id The ID of the channel to edit.
	 * @param body The updated channel data.
	 * @param optional Optional parameters for the editing.
	 * @returns A Promise that resolves to the edited channel.
	 */
	async edit(
		id: string,
		body: RESTPatchAPIChannelJSONBody,
		optional: ChannelShorterOptionalParams = { guildId: '@me' },
	): Promise<AllChannels> {
		const options = MergeOptions<MakeRequired<ChannelShorterOptionalParams, 'guildId'>>({ guildId: '@me' }, optional);
		const res = await this.client.proxy.channels(id).patch({ body, reason: options.reason });
		await this.client.cache.channels?.setIfNI(
			CacheFrom.Rest,
			BaseChannel.__intent__(options.guildId),
			res.id,
			options.guildId,
			res,
		);
		if (body.permission_overwrites && 'permission_overwrites' in res && res.permission_overwrites)
			await this.client.cache.overwrites?.setIfNI(
				CacheFrom.Rest,
				BaseChannel.__intent__(options.guildId),
				res.id,
				options.guildId,
				res.permission_overwrites,
			);
		return channelFrom(res, this.client);
	}

	/**
	 * Sends a typing indicator to the channel.
	 * @param id The ID of the channel.
	 * @returns A Promise that resolves when the typing indicator is successfully sent.
	 */
	typing(id: string): Promise<void> {
		return this.client.proxy.channels(id).typing.post();
	}

	async pins(
		channelId: string,
		query?: RESTGetAPIChannelPinsQuery,
	): Promise<{ hasMore: boolean; items: { pinnedAt: string; message: MessageStructure }[] }> {
		const pins = await this.client.proxy.channels(channelId).messages.pins.get({ query });
		await this.client.cache.messages?.patch(
			CacheFrom.Rest,
			pins.items.map(x => {
				return [x.message.id, x.message];
			}) satisfies [string, any][],
			channelId,
		);
		return {
			hasMore: pins.has_more,
			items: pins.items.map(x => ({
				pinnedAt: x.pinned_at,
				message: Transformers.Message(this.client, x.message),
			})),
		};
	}

	/**
	 * Pins a message in the channel.
	 * @param messageId The ID of the message to pin.
	 * @param channelId The ID of the channel.
	 * @param reason The reason for pinning the message.
	 * @returns A Promise that resolves when the message is successfully pinned.
	 */
	setPin(messageId: string, channelId: string, reason?: string) {
		return this.client.proxy.channels(channelId).messages.pins(messageId).put({ reason });
	}

	/**
	 * Unpins a message in the channel.
	 * @param messageId The ID of the message to unpin.
	 * @param channelId The ID of the channel.
	 * @param reason The reason for unpinning the message.
	 * @returns A Promise that resolves when the message is successfully unpinned.
	 */
	deletePin(messageId: string, channelId: string, reason?: string) {
		return this.client.proxy.channels(channelId).messages.pins(messageId).delete({ reason });
	}

	/**
	 * Creates a new thread in the channel (only guild based channels).
	 * @param channelId The ID of the parent channel.
	 * @param reason The reason for unpinning the message.
	 * @returns A promise that resolves when the thread is succesfully created.
	 */
	thread(
		channelId: string,
		body: RESTPostAPIChannelThreadsJSONBody | RESTPostAPIGuildForumThreadsJSONBody,
		reason?: string,
	): Promise<ThreadChannelStructure> {
		return this.client.threads.create(channelId, body, reason);
	}

	async memberPermissions(channelId: string, member: GuildMember, checkAdmin = true): Promise<PermissionsBitField> {
		const memberPermissions = await member.fetchPermissions();

		if (checkAdmin && memberPermissions.has([PermissionFlagsBits.Administrator])) {
			return new PermissionsBitField(PermissionsBitField.All);
		}

		const overwrites = await this.overwritesFor(channelId, member);
		const permissions = new PermissionsBitField(memberPermissions.bits);

		permissions.remove([overwrites.everyone?.deny.bits ?? 0n]);
		permissions.add([overwrites.everyone?.allow.bits ?? 0n]);
		permissions.remove(overwrites.roles.length > 0 ? overwrites.roles.map(role => role.deny.bits) : [0n]);
		permissions.add(overwrites.roles.length > 0 ? overwrites.roles.map(role => role.allow.bits) : [0n]);
		permissions.remove([overwrites.member?.deny.bits ?? 0n]);
		permissions.add([overwrites.member?.allow.bits ?? 0n]);
		return permissions;
	}

	async overwritesFor(channelId: string, member: GuildMember) {
		const roleOverwrites: ReturnType<Overwrites['get']> = [];
		let memberOverwrites: NonNullable<ReturnType<Overwrites['get']>>[number] | undefined;
		let everyoneOverwrites: NonNullable<ReturnType<Overwrites['get']>>[number] | undefined;

		const channelOverwrites = (await this.client.cache.overwrites?.get(channelId)) ?? [];

		for (const overwrite of channelOverwrites) {
			if (overwrite.id === member.guildId) {
				everyoneOverwrites = overwrite;
			} else if (member.roles.keys.includes(overwrite.id)) {
				roleOverwrites.push(overwrite);
			} else if (overwrite.id === member.id) {
				memberOverwrites = overwrite;
			}
		}

		return {
			everyone: everyoneOverwrites,
			roles: roleOverwrites,
			member: memberOverwrites,
		};
	}

	async rolePermissions(channelId: string, role: GuildRole, checkAdmin = true): Promise<PermissionsBitField> {
		if (checkAdmin && role.permissions.has([PermissionFlagsBits.Administrator])) {
			return new PermissionsBitField(PermissionsBitField.All);
		}
		const permissions = new PermissionsBitField(role.permissions.bits);
		const channelOverwrites = await this.client.cache.overwrites?.get(channelId);
		if (!channelOverwrites) return permissions;
		const everyoneOverwrites = channelOverwrites.find(x => x.id === role.guildId);
		const roleOverwrites = channelOverwrites.find(x => x.id === role.id);

		permissions.remove([everyoneOverwrites?.deny.bits ?? 0n]);
		permissions.add([everyoneOverwrites?.allow.bits ?? 0n]);
		permissions.remove([roleOverwrites?.deny.bits ?? 0n]);
		permissions.add([roleOverwrites?.allow.bits ?? 0n]);
		return permissions;
	}

	async fetchMessages(channelId: string, query?: RESTGetAPIChannelMessagesQuery): Promise<MessageStructure[]> {
		const result = await this.client.proxy.channels(channelId).messages.get({
			query,
		});
		await this.client.cache.messages?.patch(
			CacheFrom.Rest,
			result.map(x => {
				return [x.id, x];
			}) satisfies [string, any][],
			channelId,
		);
		return result.map(message => Transformers.Message(this.client, message));
	}

	setVoiceStatus(channelId: string, status: string | null = null) {
		return this.client.proxy.channels(channelId)['voice-status'].put({ body: { status } });
	}
}

export type ChannelShorterOptionalParams = Partial<{ guildId: (string & {}) | '@me'; reason: string }>;
