import {
	PermissionFlagsBits,
	type RESTPatchAPIChannelJSONBody,
	type RESTPostAPIChannelThreadsJSONBody,
	type RESTPostAPIGuildForumThreadsJSONBody,
} from 'discord-api-types/v10';
import { BaseChannel, Message, type GuildMember, type GuildRole } from '../../structures';
import channelFrom, { type AllChannels, type ThreadChannel } from '../../structures/channels';
import { PermissionsBitField } from '../../structures/extra/Permissions';
import { BaseShorter } from './base';

export class ChannelShorter extends BaseShorter {
	/**
	 * Fetches a channel by its ID.
	 * @param id The ID of the channel to fetch.
	 * @param force Whether to force fetching the channel from the API even if it exists in the cache.
	 * @returns A Promise that resolves to the fetched channel.
	 */
	async fetch(id: string, force?: boolean): Promise<AllChannels> {
		let channel;
		if (!force) {
			channel = await this.client.cache.channels?.get(id);
			if (channel) return channel;
		}

		channel = await this.client.proxy.channels(id).get();
		await this.client.cache.channels?.patch(id, undefined, channel);
		return channelFrom(channel, this.client);
	}

	/**
	 * Deletes a channel by its ID.
	 * @param id The ID of the channel to delete.
	 * @param optional Optional parameters for the deletion.
	 * @returns A Promise that resolves to the deleted channel.
	 */
	async delete(id: string, optional: ChannelShorterOptionalParams = { guildId: '@me' }): Promise<AllChannels> {
		const res = await this.client.proxy.channels(id).delete({ reason: optional.reason });
		await this.client.cache.channels?.removeIfNI(BaseChannel.__intent__(optional.guildId!), res.id, optional.guildId!);
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
		const res = await this.client.proxy.channels(id).patch({ body, reason: optional.reason });
		await this.client.cache.channels?.setIfNI(
			BaseChannel.__intent__(optional.guildId!),
			res.id,
			optional.guildId!,
			res,
		);
		if (body.permission_overwrites && 'permission_overwrites' in res)
			await this.client.cache.overwrites?.setIfNI(
				BaseChannel.__intent__(optional.guildId!),
				res.id,
				optional.guildId!,
				res.permission_overwrites,
			);
		return channelFrom(res, this.client);
	}

	/**
	 * Sends a typing indicator to the channel.
	 * @param id The ID of the channel.
	 * @returns A Promise that resolves when the typing indicator is successfully sent.
	 */
	async typing(id: string): Promise<void> {
		await this.client.proxy.channels(id).typing.post();
	}

	async pins(channelId: string): Promise<Message[]> {
		const messages = await this.client.proxy.channels(channelId).pins.get();
		return messages.map(message => new Message(this.client, message));
	}

	/**
	 * Pins a message in the channel.
	 * @param messageId The ID of the message to pin.
	 * @param channelId The ID of the channel.
	 * @param reason The reason for pinning the message.
	 * @returns A Promise that resolves when the message is successfully pinned.
	 */
	setPin(messageId: string, channelId: string, reason?: string) {
		return this.client.proxy.channels(channelId).pins(messageId).put({ reason });
	}

	/**
	 * Unpins a message in the channel.
	 * @param messageId The ID of the message to unpin.
	 * @param channelId The ID of the channel.
	 * @param reason The reason for unpinning the message.
	 * @returns A Promise that resolves when the message is successfully unpinned.
	 */
	deletePin(messageId: string, channelId: string, reason?: string) {
		return this.client.proxy.channels(channelId).pins(messageId).delete({ reason });
	}

	/**
	 * Creates a new thread in the channel (only guild based channels).
	 * @param channelId The ID of the parent channel.
	 * @param reason The reason for unpinning the message.
	 * @returns A promise that resolves when the thread is succesfully created.
	 */
	async thread(
		channelId: string,
		body: RESTPostAPIChannelThreadsJSONBody | RESTPostAPIGuildForumThreadsJSONBody,
		reason?: string,
	) {
		return (
			this.client.proxy
				.channels(channelId)
				.threads.post({ body, reason })
				// When testing this, discord returns the thread object, but in discord api types it does not.
				.then(thread => channelFrom(thread, this.client) as ThreadChannel)
		);
	}

	async memberPermissions(channelId: string, member: GuildMember, checkAdmin = true): Promise<PermissionsBitField> {
		const permissions = await member.fetchPermissions();

		if (checkAdmin && permissions.has(PermissionFlagsBits.Administrator)) {
			return new PermissionsBitField(PermissionsBitField.All);
		}

		const overwrites = await this.overwritesFor(channelId, member);

		permissions.remove(overwrites.everyone?.deny.bits ?? 0n);
		permissions.add(overwrites.everyone?.allow.bits ?? 0n);
		permissions.remove(overwrites.roles.length > 0 ? overwrites.roles.map(role => role.deny.bits) : 0n);
		permissions.add(overwrites.roles.length > 0 ? overwrites.roles.map(role => role.allow.bits) : 0n);
		permissions.remove(overwrites.member?.deny.bits ?? 0n);
		permissions.add(overwrites.member?.allow.bits ?? 0n);
		return permissions;
	}

	async overwritesFor(channelId: string, member: GuildMember) {
		const roleOverwrites = [];
		let memberOverwrites;
		let everyoneOverwrites;

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
		if (checkAdmin && role.permissions.has(PermissionFlagsBits.Administrator)) {
			return new PermissionsBitField(PermissionsBitField.All);
		}
		const channelOverwrites = (await this.client.cache.overwrites?.get(channelId)) ?? [];

		const everyoneOverwrites = channelOverwrites.find(x => x.id === role.guildId);
		const roleOverwrites = channelOverwrites.find(x => x.id === role.id);
		const permissions = new PermissionsBitField(role.permissions.bits);

		permissions.remove(everyoneOverwrites?.deny.bits ?? 0n);
		permissions.add(everyoneOverwrites?.allow.bits ?? 0n);
		permissions.remove(roleOverwrites?.deny.bits ?? 0n);
		permissions.add(roleOverwrites?.allow.bits ?? 0n);
		return permissions;
	}
}

export type ChannelShorterOptionalParams = Partial<{ guildId: string; reason: string }>;
