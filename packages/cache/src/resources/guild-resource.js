"use strict";
/**
 * refactor
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _GuildResource_namespace, _GuildResource_adapter, _GuildResource_channels, _GuildResource_emojis, _GuildResource_members, _GuildResource_roles, _GuildResource_stickers, _GuildResource_voices, _GuildResource_presences;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildResource = void 0;
const channel_resource_1 = require("./channel-resource");
const guild_emoji_resource_1 = require("./guild-emoji-resource");
const guild_member_resource_1 = require("./guild-member-resource");
const guild_role_resource_1 = require("./guild-role-resource");
const guild_sticker_resource_1 = require("./guild-sticker-resource");
const guild_voice_resource_1 = require("./guild-voice-resource");
const presence_resource_1 = require("./presence-resource");
const base_resource_1 = require("./base-resource");
/**
 * Resource represented by an guild of discord
 */
class GuildResource extends base_resource_1.BaseResource {
    constructor(adapter, entity, parent, channels, emojis, members, roles, stickers, voices, presences) {
        super('guild', adapter);
        _GuildResource_namespace.set(this, 'guild');
        _GuildResource_adapter.set(this, void 0);
        _GuildResource_channels.set(this, void 0);
        _GuildResource_emojis.set(this, void 0);
        _GuildResource_members.set(this, void 0);
        _GuildResource_roles.set(this, void 0);
        _GuildResource_stickers.set(this, void 0);
        _GuildResource_voices.set(this, void 0);
        _GuildResource_presences.set(this, void 0);
        __classPrivateFieldSet(this, _GuildResource_adapter, adapter, "f");
        __classPrivateFieldSet(this, _GuildResource_channels, channels ?? new channel_resource_1.ChannelResource(adapter), "f");
        __classPrivateFieldSet(this, _GuildResource_emojis, emojis ?? new guild_emoji_resource_1.GuildEmojiResource(adapter), "f");
        __classPrivateFieldSet(this, _GuildResource_members, members ?? new guild_member_resource_1.GuildMemberResource(adapter), "f");
        __classPrivateFieldSet(this, _GuildResource_roles, roles ?? new guild_role_resource_1.GuildRoleResource(adapter), "f");
        __classPrivateFieldSet(this, _GuildResource_stickers, stickers ?? new guild_sticker_resource_1.GuildStickerResource(adapter), "f");
        __classPrivateFieldSet(this, _GuildResource_voices, voices ?? new guild_voice_resource_1.GuildVoiceResource(adapter), "f");
        __classPrivateFieldSet(this, _GuildResource_presences, presences ?? new presence_resource_1.PresenceResource(adapter), "f");
        if (entity) {
            this.setEntity(entity);
        }
        if (parent) {
            this.setParent(parent);
        }
    }
    /**
     * @inheritDoc
     */
    async get(id) {
        if (this.parent) {
            return this;
        }
        const kv = await __classPrivateFieldGet(this, _GuildResource_adapter, "f").get(this.hashId(id));
        if (kv) {
            return new GuildResource(__classPrivateFieldGet(this, _GuildResource_adapter, "f"), kv, id, new channel_resource_1.ChannelResource(__classPrivateFieldGet(this, _GuildResource_adapter, "f")), new guild_emoji_resource_1.GuildEmojiResource(__classPrivateFieldGet(this, _GuildResource_adapter, "f"), null, id), new guild_member_resource_1.GuildMemberResource(__classPrivateFieldGet(this, _GuildResource_adapter, "f"), null, id), new guild_role_resource_1.GuildRoleResource(__classPrivateFieldGet(this, _GuildResource_adapter, "f"), null, id), new guild_sticker_resource_1.GuildStickerResource(__classPrivateFieldGet(this, _GuildResource_adapter, "f"), null, id), new guild_voice_resource_1.GuildVoiceResource(__classPrivateFieldGet(this, _GuildResource_adapter, "f"), null, id), new presence_resource_1.PresenceResource(__classPrivateFieldGet(this, _GuildResource_adapter, "f")));
        }
        return null;
    }
    /**
     * @inheritDoc
     */
    async set(id, data) {
        if (data.channels) {
            const channels = [];
            for (const channel of data.channels) {
                channel.guild_id = id;
                await __classPrivateFieldGet(this, _GuildResource_channels, "f").set(channel.id, channel);
            }
            await Promise.all(channels);
        }
        if (data.emojis) {
            const emojis = [];
            for (const emoji of data.emojis) {
                emoji.guild_id = id;
                await __classPrivateFieldGet(this, _GuildResource_emojis, "f").set(emoji.id, id, emoji);
            }
            await Promise.all(emojis);
        }
        if (data.members) {
            const members = [];
            for (const member of data.members) {
                member.guild_id = id;
                await __classPrivateFieldGet(this, _GuildResource_members, "f").set(member.user.id, id, member);
            }
            await Promise.all(members);
        }
        if (data.roles) {
            const roles = [];
            for (const role of data.roles) {
                role.guild_id = id;
                await __classPrivateFieldGet(this, _GuildResource_roles, "f").set(role.id, id, role);
            }
            await Promise.all(roles);
        }
        if (data.stickers) {
            const stickers = [];
            for (const sticker of data.stickers) {
                sticker.guild_id = id;
                await __classPrivateFieldGet(this, _GuildResource_stickers, "f").set(sticker.id, id, sticker);
            }
            await Promise.all(stickers);
        }
        if (data.voice_states) {
            const voices = [];
            for (const voice of data.voice_states) {
                voice.guild_id = id;
                voices.push(__classPrivateFieldGet(this, _GuildResource_voices, "f").set(voice.user_id, id, voice));
            }
            await Promise.all(voices);
        }
        if (data.presences) {
            const presences = [];
            for (const presence of data.presences) {
                await __classPrivateFieldGet(this, _GuildResource_presences, "f").set(presence.user.id, presence);
            }
            await Promise.all(presences);
        }
        delete data.channels;
        delete data.emojis;
        delete data.members;
        delete data.roles;
        delete data.stickers;
        delete data.voice_states;
        delete data.guild_hashes;
        delete data.presences;
        if (this.parent) {
            this.setEntity(data);
        }
        await this.addToRelationship(id);
        await __classPrivateFieldGet(this, _GuildResource_adapter, "f").set(this.hashId(id), data);
    }
    /**
     * @inheritDoc
     */
    async items() {
        const data = await __classPrivateFieldGet(this, _GuildResource_adapter, "f").items(__classPrivateFieldGet(this, _GuildResource_namespace, "f"));
        if (data) {
            return data.map(dt => {
                const resource = new GuildResource(__classPrivateFieldGet(this, _GuildResource_adapter, "f"), dt);
                resource.setParent(resource.id);
                return resource;
            });
        }
        return [];
    }
    /**
     * @inheritDoc
     */
    async count() {
        return await __classPrivateFieldGet(this, _GuildResource_adapter, "f").count(__classPrivateFieldGet(this, _GuildResource_namespace, "f"));
    }
    /**
     * @inheritDoc
     */
    async remove(id) {
        const members = await __classPrivateFieldGet(this, _GuildResource_members, "f").getToRelationship(id);
        for (const member of members) {
            await __classPrivateFieldGet(this, _GuildResource_members, "f").remove(member, id);
        }
        const roles = await __classPrivateFieldGet(this, _GuildResource_roles, "f").getToRelationship(id);
        for (const role of roles) {
            await __classPrivateFieldGet(this, _GuildResource_roles, "f").remove(role, id);
        }
        const emojis = await __classPrivateFieldGet(this, _GuildResource_emojis, "f").getToRelationship(id);
        for (const emoji of emojis) {
            await __classPrivateFieldGet(this, _GuildResource_emojis, "f").remove(emoji, id);
        }
        const stickers = await __classPrivateFieldGet(this, _GuildResource_stickers, "f").getToRelationship(id);
        for (const sticker of stickers) {
            await __classPrivateFieldGet(this, _GuildResource_stickers, "f").remove(sticker, id);
        }
        await this.removeToRelationship(id);
        await __classPrivateFieldGet(this, _GuildResource_adapter, "f").remove(this.hashId(id));
    }
    /**
     * @inheritDoc
     */
    async contains(id) {
        return await __classPrivateFieldGet(this, _GuildResource_adapter, "f").contains(__classPrivateFieldGet(this, _GuildResource_namespace, "f"), id);
    }
    /**
     * @inheritDoc
     */
    async getToRelationship() {
        return await __classPrivateFieldGet(this, _GuildResource_adapter, "f").getToRelationship(__classPrivateFieldGet(this, _GuildResource_namespace, "f"));
    }
    /**
     * @inheritDoc
     */
    async addToRelationship(id) {
        await __classPrivateFieldGet(this, _GuildResource_adapter, "f").addToRelationship(__classPrivateFieldGet(this, _GuildResource_namespace, "f"), id);
    }
    /**
     * @inheritDoc
     */
    async removeToRelationship(id) {
        await __classPrivateFieldGet(this, _GuildResource_adapter, "f").removeToRelationship(__classPrivateFieldGet(this, _GuildResource_namespace, "f"), id);
    }
    /**
     * @inheritDoc
     */
    async getEmojis() {
        return await __classPrivateFieldGet(this, _GuildResource_emojis, "f").items(this.parent);
    }
    /**
     * @inheritDoc
     */
    async getMembers() {
        return await __classPrivateFieldGet(this, _GuildResource_members, "f").items(this.parent);
    }
    /**
     * @inheritDoc
     */
    async getRoles() {
        return await __classPrivateFieldGet(this, _GuildResource_roles, "f").items(this.parent);
    }
    /**
     * @inheritDoc
     */
    async getStickers() {
        return await __classPrivateFieldGet(this, _GuildResource_stickers, "f").items(this.parent);
    }
    /**
     * @inheritDoc
     */
    async getVoiceStates() {
        return await __classPrivateFieldGet(this, _GuildResource_voices, "f").items(this.parent);
    }
}
exports.GuildResource = GuildResource;
_GuildResource_namespace = new WeakMap(), _GuildResource_adapter = new WeakMap(), _GuildResource_channels = new WeakMap(), _GuildResource_emojis = new WeakMap(), _GuildResource_members = new WeakMap(), _GuildResource_roles = new WeakMap(), _GuildResource_stickers = new WeakMap(), _GuildResource_voices = new WeakMap(), _GuildResource_presences = new WeakMap();
