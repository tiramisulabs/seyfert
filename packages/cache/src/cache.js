"use strict";
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
var _Cache_adapter;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const memory_cache_adapter_1 = require("./scheme/adapters/memory-cache-adapter");
const resources_1 = require("./resources");
const options_1 = require("./utils/options");
class Cache {
    constructor(options) {
        _Cache_adapter.set(this, void 0);
        this.options = (0, options_1.Options)({}, Cache.DEFAULTS, options);
        __classPrivateFieldSet(this, _Cache_adapter, this.options.adapter, "f");
        this.channels = new resources_1.ChannelResource(__classPrivateFieldGet(this, _Cache_adapter, "f"));
        this.emojis = new resources_1.GuildEmojiResource(__classPrivateFieldGet(this, _Cache_adapter, "f"));
        this.members = new resources_1.GuildMemberResource(__classPrivateFieldGet(this, _Cache_adapter, "f"));
        this.guilds = new resources_1.GuildResource(__classPrivateFieldGet(this, _Cache_adapter, "f"));
        this.roles = new resources_1.GuildRoleResource(__classPrivateFieldGet(this, _Cache_adapter, "f"));
        this.stickers = new resources_1.GuildStickerResource(__classPrivateFieldGet(this, _Cache_adapter, "f"));
        this.voices = new resources_1.GuildVoiceResource(__classPrivateFieldGet(this, _Cache_adapter, "f"));
        this.presences = new resources_1.PresenceResource(__classPrivateFieldGet(this, _Cache_adapter, "f"));
        this.users = new resources_1.UserResource(__classPrivateFieldGet(this, _Cache_adapter, "f"));
    }
    /**
     * @inheritDoc
     */
    async start(event) {
        let resources = [];
        let contents = [];
        switch (event.t) {
            case 'READY':
                resources = [];
                await this.users.set(event.d.user.id, event.d.user);
                for (const guild of event.d.guilds) {
                    resources.push(this.guilds.set(guild.id, guild));
                }
                await Promise.all(resources);
                break;
            case 'USER_UPDATE':
                await this.users.set(event.d.id, event.d);
                break;
            case 'PRESENCE_UPDATE':
                await this.presences.set(event.d.user?.id, event.d);
                break;
            case 'GUILD_CREATE':
            case 'GUILD_UPDATE':
                await this.guilds.set(event.d.id, event.d);
                break;
            case 'GUILD_DELETE':
                if (event.d.unavailable) {
                    await this.guilds.set(event.d.id, event.d);
                }
                else {
                    await this.guilds.remove(event.d.id);
                }
                break;
            case 'CHANNEL_CREATE':
            case 'CHANNEL_UPDATE':
                // modify [Add elimination system]
                await this.channels.set(event.d.id, event.d);
                break;
            case 'CHANNEL_DELETE':
                // modify [Add elimination system]
                await this.channels.remove(event.d.id);
                break;
            case 'MESSAGE_CREATE':
                if (event.d.webhook_id) {
                    return;
                }
                if (event.d.author) {
                    await this.users.set(event.d.author.id, event.d.author);
                }
                break;
            case 'GUILD_ROLE_CREATE':
            case 'GUILD_ROLE_UPDATE':
                await this.roles.set(event.d.role.id, event.d.guild_id, event.d.role);
                break;
            case 'GUILD_ROLE_DELETE':
                await this.roles.remove(event.d.role.id, event.d.guild_id);
                break;
            case 'GUILD_EMOJIS_UPDATE':
                contents = [];
                contents = await this.emojis.items(event.d.guild_id);
                for (const emoji of event.d.emojis) {
                    const emote = contents.find(o => o?.id === emoji.id);
                    if (!emote || emote !== emoji) {
                        await this.emojis.set(emoji.id, event.d.guild_id, emoji);
                    }
                }
                for (const emoji of contents) {
                    const emote = event.d.emojis.find((o) => o.id === emoji?.id);
                    if (!emote) {
                        await this.emojis.remove(emote.id, event.d.guild_id);
                    }
                }
                break;
            case 'GUILD_STICKERS_UPDATE':
                contents = [];
                contents = await this.stickers.items(event.d.guild_id);
                for (const sticker of event.d.stickers) {
                    const stick = contents.find(o => o?.id === sticker.id);
                    if (!stick || stick !== sticker) {
                        await this.stickers.set(sticker.id, event.d.guild_id, sticker);
                    }
                }
                for (const sticker of contents) {
                    const stick = event.d.stickers.find((o) => o.id === sticker?.id);
                    if (!stick) {
                        await this.stickers.remove(stick.id, event.d.guild_id);
                    }
                }
                break;
            case 'GUILD_MEMBER_ADD':
            case 'GUILD_MEMBER_UPDATE':
                await this.members.set(event.d.user.id, event.d.guild_id, event.d);
                break;
            case 'GUILD_MEMBER_REMOVE':
                await this.members.remove(event.d.user.id, event.d.guild_id);
                break;
            case 'GUILD_MEMBERS_CHUNK':
                resources = [];
                for (const member of event.d.members) {
                    resources.push(this.members.set(member.user.id, event.d.guild_id, member));
                }
                await Promise.all(resources);
                break;
            case 'VOICE_STATE_UPDATE':
                if (!event.d.guild_id) {
                    return;
                }
                if (event.d.guild_id && event.d.member && event.d.user_id) {
                    await this.members.set(event.d.user_id, event.d.guild_id, {
                        guild_id: event.d.guild_id,
                        ...event.d.member,
                    });
                }
                if (event.d.channel_id != null) {
                    await this.members.set(event.d.user_id, event.d.guild_id, event.d);
                }
                else {
                    await this.voices.remove(event.d.user_id, event.d.guild_id);
                }
                break;
        }
    }
}
exports.Cache = Cache;
_Cache_adapter = new WeakMap();
Cache.DEFAULTS = {
    adapter: new memory_cache_adapter_1.MemoryCacheAdapter(),
};
