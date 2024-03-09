import { PermissionFlagsBits, type RESTPatchAPIChannelJSONBody } from '..';
import { BaseChannel, Message, type GuildMember, type GuildRole } from '../../structures';
import channelFrom, { type AllChannels } from '../../structures/channels';
import { PermissionsBitField } from '../../structures/extra/Permissions';
import { BaseShorter } from './base';

export class ChannelShorter extends BaseShorter {
	get channels() {
		return {
			/**
			 * Fetches a channel by its ID.
			 * @param id The ID of the channel to fetch.
			 * @param force Whether to force fetching the channel from the API even if it exists in the cache.
			 * @returns A Promise that resolves to the fetched channel.
			 */
			fetch: async (id: string, force?: boolean): Promise<AllChannels> => {
				let channel;
				if (!force) {
					channel = await this.client.cache.channels?.get(id);
					if (channel) return channel;
				}

				channel = await this.client.proxy.channels(id).get();
				await this.client.cache.channels?.patch(id, undefined, channel);
				return channelFrom(channel, this.client);
			},

			/**
			 * Deletes a channel by its ID.
			 * @param id The ID of the channel to delete.
			 * @param optional Optional parameters for the deletion.
			 * @returns A Promise that resolves to the deleted channel.
			 */
			delete: async (id: string, optional: ChannelShorterOptionalParams = { guildId: '@me' }) => {
				const res = await this.client.proxy.channels(id).delete({ reason: optional.reason });
				await this.client.cache.channels?.removeIfNI(
					BaseChannel.__intent__(optional.guildId!),
					res.id,
					optional.guildId!,
				);
				return channelFrom(res, this.client);
			},

			/**
			 * Edits a channel by its ID.
			 * @param id The ID of the channel to edit.
			 * @param body The updated channel data.
			 * @param optional Optional parameters for the editing.
			 * @returns A Promise that resolves to the edited channel.
			 */
			edit: async (
				id: string,
				body: RESTPatchAPIChannelJSONBody,
				optional: ChannelShorterOptionalParams = { guildId: '@me' },
			) => {
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
			},

			/**
			 * Sends a typing indicator to the channel.
			 * @param id The ID of the channel.
			 * @returns A Promise that resolves when the typing indicator is successfully sent.
			 */
			typing: (id: string) => this.client.proxy.channels(id).typing.post(),

			/**
			 * Provides access to pinned messages in the channel.
			 */
			pins: this.pins,
			overwrites: this.overwrites,
		};
	}

	get pins() {
		return {
			/**
			 * Fetches pinned messages in the channel.
			 * @param channelId The ID of the channel.
			 * @returns A Promise that resolves to an array of pinned messages.
			 */
			fetch: (channelId: string) =>
				this.client.proxy
					.channels(channelId)
					.pins.get()
					.then(messages => messages.map(message => new Message(this.client, message))),

			/**
			 * Pins a message in the channel.
			 * @param messageId The ID of the message to pin.
			 * @param channelId The ID of the channel.
			 * @param reason The reason for pinning the message.
			 * @returns A Promise that resolves when the message is successfully pinned.
			 */
			set: (messageId: string, channelId: string, reason?: string) =>
				this.client.proxy.channels(channelId).pins(messageId).put({ reason }),

			/**
			 * Unpins a message in the channel.
			 * @param messageId The ID of the message to unpin.
			 * @param channelId The ID of the channel.
			 * @param reason The reason for unpinning the message.
			 * @returns A Promise that resolves when the message is successfully unpinned.
			 */
			delete: (messageId: string, channelId: string, reason?: string) =>
				this.client.proxy.channels(channelId).pins(messageId).delete({ reason }),
		};
	}

	get overwrites() {
		return {
			memberPermissions: async (channelId: string, member: GuildMember, checkAdmin = true) => {
				const permissions = await member.fetchPermissions();

				if (checkAdmin && permissions.has(PermissionFlagsBits.Administrator)) {
					return new PermissionsBitField(PermissionsBitField.All);
				}

				const overwrites = await this.overwrites.overwritesFor(channelId, member);

				permissions.remove(overwrites.everyone?.deny.bits ?? 0n);
				permissions.add(overwrites.everyone?.allow.bits ?? 0n);
				permissions.remove(overwrites.roles.length > 0 ? overwrites.roles.map(role => role.deny.bits) : 0n);
				permissions.add(overwrites.roles.length > 0 ? overwrites.roles.map(role => role.allow.bits) : 0n);
				permissions.remove(overwrites.member?.deny.bits ?? 0n);
				permissions.add(overwrites.member?.allow.bits ?? 0n);
				return permissions;
			},
			overwritesFor: async (channelId: string, member: GuildMember) => {
				const roleOverwrites = [];
				let memberOverwrites;
				let everyoneOverwrites;

				const channelOverwrites = (await this.client.cache.overwrites?.get(channelId)) ?? [];

				for (const overwrite of channelOverwrites) {
					if (overwrite.id === member.guildId) {
						everyoneOverwrites = overwrite;
					} else if (member.roles.values.includes(overwrite.id)) {
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
			},
			rolePermissions: async (channelId: string, role: GuildRole, checkAdmin = true) => {
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
			},
		};
	}
}

export type ChannelShorterOptionalParams = Partial<{ guildId: string; reason: string }>;
