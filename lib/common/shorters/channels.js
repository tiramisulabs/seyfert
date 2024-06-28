"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelShorter = void 0;
const v10_1 = require("discord-api-types/v10");
const structures_1 = require("../../structures");
const channels_1 = __importDefault(require("../../structures/channels"));
const Permissions_1 = require("../../structures/extra/Permissions");
const base_1 = require("./base");
const utils_1 = require("../it/utils");
const transformers_1 = require("../../client/transformers");
class ChannelShorter extends base_1.BaseShorter {
    /**
     * Fetches a channel by its ID.
     * @param id The ID of the channel to fetch.
     * @param force Whether to force fetching the channel from the API even if it exists in the cache.
     * @returns A Promise that resolves to the fetched channel.
     */
    async fetch(id, force) {
        return (0, channels_1.default)(await this.raw(id, force), this.client);
    }
    async raw(id, force) {
        let channel;
        if (!force) {
            channel = await this.client.cache.channels?.raw(id);
            if (channel)
                return channel;
        }
        channel = await this.client.proxy.channels(id).get();
        await this.client.cache.channels?.patch(id, undefined, channel);
        return channel;
    }
    /**
     * Deletes a channel by its ID.
     * @param id The ID of the channel to delete.
     * @param optional Optional parameters for the deletion.
     * @returns A Promise that resolves to the deleted channel.
     */
    async delete(id, optional = { guildId: '@me' }) {
        const options = (0, utils_1.MergeOptions)({ guildId: '@me' }, optional);
        const res = await this.client.proxy.channels(id).delete({ reason: options.reason });
        await this.client.cache.channels?.removeIfNI(structures_1.BaseChannel.__intent__(options.guildId), res.id, options.guildId);
        return (0, channels_1.default)(res, this.client);
    }
    /**
     * Edits a channel by its ID.
     * @param id The ID of the channel to edit.
     * @param body The updated channel data.
     * @param optional Optional parameters for the editing.
     * @returns A Promise that resolves to the edited channel.
     */
    async edit(id, body, optional = { guildId: '@me' }) {
        const options = (0, utils_1.MergeOptions)({ guildId: '@me' }, optional);
        const res = await this.client.proxy.channels(id).patch({ body, reason: options.reason });
        await this.client.cache.channels?.setIfNI(structures_1.BaseChannel.__intent__(options.guildId), res.id, options.guildId, res);
        if (body.permission_overwrites && 'permission_overwrites' in res && res.permission_overwrites)
            await this.client.cache.overwrites?.setIfNI(structures_1.BaseChannel.__intent__(options.guildId), res.id, options.guildId, res.permission_overwrites);
        return (0, channels_1.default)(res, this.client);
    }
    /**
     * Sends a typing indicator to the channel.
     * @param id The ID of the channel.
     * @returns A Promise that resolves when the typing indicator is successfully sent.
     */
    async typing(id) {
        await this.client.proxy.channels(id).typing.post();
    }
    async pins(channelId) {
        const messages = await this.client.proxy.channels(channelId).pins.get();
        await this.client.cache.messages?.patch(messages.map(x => {
            return [x.id, x];
        }), channelId);
        return messages.map(message => transformers_1.Transformers.Message(this.client, message));
    }
    /**
     * Pins a message in the channel.
     * @param messageId The ID of the message to pin.
     * @param channelId The ID of the channel.
     * @param reason The reason for pinning the message.
     * @returns A Promise that resolves when the message is successfully pinned.
     */
    setPin(messageId, channelId, reason) {
        return this.client.proxy.channels(channelId).pins(messageId).put({ reason });
    }
    /**
     * Unpins a message in the channel.
     * @param messageId The ID of the message to unpin.
     * @param channelId The ID of the channel.
     * @param reason The reason for unpinning the message.
     * @returns A Promise that resolves when the message is successfully unpinned.
     */
    deletePin(messageId, channelId, reason) {
        return this.client.proxy.channels(channelId).pins(messageId).delete({ reason });
    }
    /**
     * Creates a new thread in the channel (only guild based channels).
     * @param channelId The ID of the parent channel.
     * @param reason The reason for unpinning the message.
     * @returns A promise that resolves when the thread is succesfully created.
     */
    async thread(channelId, body, reason) {
        return this.client.threads.create(channelId, body, reason);
    }
    async memberPermissions(channelId, member, checkAdmin = true) {
        const memberPermissions = await member.fetchPermissions();
        if (checkAdmin && memberPermissions.has(v10_1.PermissionFlagsBits.Administrator)) {
            return new Permissions_1.PermissionsBitField(Permissions_1.PermissionsBitField.All);
        }
        const overwrites = await this.overwritesFor(channelId, member);
        const permissions = new Permissions_1.PermissionsBitField(memberPermissions.bits);
        permissions.remove(overwrites.everyone?.deny.bits ?? 0n);
        permissions.add(overwrites.everyone?.allow.bits ?? 0n);
        permissions.remove(overwrites.roles.length > 0 ? overwrites.roles.map(role => role.deny.bits) : 0n);
        permissions.add(overwrites.roles.length > 0 ? overwrites.roles.map(role => role.allow.bits) : 0n);
        permissions.remove(overwrites.member?.deny.bits ?? 0n);
        permissions.add(overwrites.member?.allow.bits ?? 0n);
        return permissions;
    }
    async overwritesFor(channelId, member) {
        const roleOverwrites = [];
        let memberOverwrites;
        let everyoneOverwrites;
        const channelOverwrites = (await this.client.cache.overwrites?.get(channelId)) ?? [];
        for (const overwrite of channelOverwrites) {
            if (overwrite.id === member.guildId) {
                everyoneOverwrites = overwrite;
            }
            else if (member.roles.keys.includes(overwrite.id)) {
                roleOverwrites.push(overwrite);
            }
            else if (overwrite.id === member.id) {
                memberOverwrites = overwrite;
            }
        }
        return {
            everyone: everyoneOverwrites,
            roles: roleOverwrites,
            member: memberOverwrites,
        };
    }
    async rolePermissions(channelId, role, checkAdmin = true) {
        if (checkAdmin && role.permissions.has(v10_1.PermissionFlagsBits.Administrator)) {
            return new Permissions_1.PermissionsBitField(Permissions_1.PermissionsBitField.All);
        }
        const channelOverwrites = (await this.client.cache.overwrites?.get(channelId)) ?? [];
        const everyoneOverwrites = channelOverwrites.find(x => x.id === role.guildId);
        const roleOverwrites = channelOverwrites.find(x => x.id === role.id);
        const permissions = new Permissions_1.PermissionsBitField(role.permissions.bits);
        permissions.remove(everyoneOverwrites?.deny.bits ?? 0n);
        permissions.add(everyoneOverwrites?.allow.bits ?? 0n);
        permissions.remove(roleOverwrites?.deny.bits ?? 0n);
        permissions.add(roleOverwrites?.allow.bits ?? 0n);
        return permissions;
    }
    async fetchMessages(channelId, query) {
        const result = await this.client.proxy.channels(channelId).messages.get({
            query,
        });
        await this.client.cache.messages?.patch(result.map(x => {
            return [x.id, x];
        }), channelId);
        return result.map(message => transformers_1.Transformers.Message(this.client, message));
    }
    setVoiceStatus(channelId, status = null) {
        return this.client.proxy.channels(channelId)['voice-status'].put({ body: { status } });
    }
}
exports.ChannelShorter = ChannelShorter;
