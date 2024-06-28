"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectoryChannel = exports.NewsChannel = exports.CategoryChannel = exports.ThreadChannel = exports.ForumChannel = exports.MediaChannel = exports.StageChannel = exports.VoiceChannel = exports.DMChannel = exports.TextGuildChannel = exports.WebhookChannelMethods = exports.WebhookGuildMethods = exports.VoiceChannelMethods = exports.ThreadOnlyMethods = exports.TopicableGuildChannel = exports.TextBaseGuildChannel = exports.MessagesMethods = exports.BaseGuildChannel = exports.BaseChannel = void 0;
exports.default = channelFrom;
const v10_1 = require("discord-api-types/v10");
const ts_mixer_1 = require("ts-mixer");
const builders_1 = require("../builders");
const DiscordBase_1 = require("./extra/DiscordBase");
const functions_1 = require("./extra/functions");
const __1 = require("..");
const transformers_1 = require("../client/transformers");
class BaseChannel extends DiscordBase_1.DiscordBase {
    constructor(client, data) {
        super(client, data);
    }
    static __intent__(id) {
        return id === '@me' ? 'DirectMessages' : 'Guilds';
    }
    /** The URL to the channel */
    get url() {
        return (0, functions_1.channelLink)(this.id);
    }
    fetch(force = false) {
        return this.client.channels.fetch(this.id, force);
    }
    delete(reason) {
        return this.client.channels.delete(this.id, { reason });
    }
    edit(body, reason) {
        return this.client.channels.edit(this.id, body, {
            reason,
            guildId: 'guildId' in this ? this.guildId : '@me',
        });
    }
    toString() {
        return __1.Formatter.channelMention(this.id);
    }
    isStage() {
        return this.type === v10_1.ChannelType.GuildStageVoice;
    }
    isMedia() {
        return this.type === v10_1.ChannelType.GuildMedia;
    }
    isDM() {
        return [v10_1.ChannelType.DM, v10_1.ChannelType.GroupDM].includes(this.type);
    }
    isForum() {
        return this.type === v10_1.ChannelType.GuildForum;
    }
    isThread() {
        return [v10_1.ChannelType.PublicThread, v10_1.ChannelType.PrivateThread, v10_1.ChannelType.AnnouncementThread].includes(this.type);
    }
    isDirectory() {
        return this.type === v10_1.ChannelType.GuildDirectory;
    }
    isVoice() {
        return this.type === v10_1.ChannelType.GuildVoice;
    }
    isTextGuild() {
        return this.type === v10_1.ChannelType.GuildText;
    }
    isCategory() {
        return this.type === v10_1.ChannelType.GuildCategory;
    }
    isNews() {
        return this.type === v10_1.ChannelType.GuildAnnouncement;
    }
    isTextable() {
        return 'messages' in this;
    }
    isGuildTextable() {
        return !this.isDM() && this.isTextable();
    }
    isThreadOnly() {
        return this.isForum() || this.isMedia();
    }
    is(channelTypes) {
        return channelTypes.some(x => v10_1.ChannelType[x] === this.type);
    }
    static allMethods(ctx) {
        return {
            list: (force = false) => ctx.client.guilds.channels.list(ctx.guildId, force),
            fetch: (id, force = false) => ctx.client.guilds.channels.fetch(ctx.guildId, id, force),
            create: (body) => ctx.client.guilds.channels.create(ctx.guildId, body),
            delete: (id, reason) => ctx.client.guilds.channels.delete(ctx.guildId, id, reason),
            edit: (id, body, reason) => ctx.client.guilds.channels.edit(ctx.guildId, id, body, reason),
            editPositions: (body) => ctx.client.guilds.channels.editPositions(ctx.guildId, body),
        };
    }
}
exports.BaseChannel = BaseChannel;
class BaseGuildChannel extends BaseChannel {
    constructor(client, data) {
        const { permission_overwrites, ...rest } = data;
        super(client, rest);
    }
    permissionOverwrites = {
        fetch: () => this.client.cache.overwrites?.get(this.id),
        values: () => (this.guildId ? this.client.cache.overwrites?.values(this.guildId) ?? [] : []),
    };
    memberPermissions(member, checkAdmin = true) {
        return this.client.channels.memberPermissions(this.id, member, checkAdmin);
    }
    rolePermissions(role, checkAdmin = true) {
        return this.client.channels.rolePermissions(this.id, role, checkAdmin);
    }
    overwritesFor(member) {
        return this.client.channels.overwritesFor(this.id, member);
    }
    guild(force = false) {
        return this.client.guilds.fetch(this.guildId, force);
    }
    get url() {
        return (0, functions_1.channelLink)(this.id, this.guildId);
    }
    setPosition(position, reason) {
        return this.edit({ position }, reason);
    }
    setName(name, reason) {
        return this.edit({ name }, reason);
    }
    setParent(parent_id, reason) {
        return this.edit({ parent_id }, reason);
    }
}
exports.BaseGuildChannel = BaseGuildChannel;
class MessagesMethods extends DiscordBase_1.DiscordBase {
    typing() {
        return this.client.channels.typing(this.id);
    }
    messages = MessagesMethods.messages({
        client: this.client,
        channelId: this.id,
    });
    pins = MessagesMethods.pins({ client: this.client, channelId: this.id });
    reactions = MessagesMethods.reactions({
        client: this.client,
        channelId: this.id,
    });
    static messages(ctx) {
        return {
            write: (body) => ctx.client.messages.write(ctx.channelId, body),
            edit: (messageId, body) => ctx.client.messages.edit(messageId, ctx.channelId, body),
            crosspost: (messageId, reason) => ctx.client.messages.crosspost(messageId, ctx.channelId, reason),
            delete: (messageId, reason) => ctx.client.messages.delete(messageId, ctx.channelId, reason),
            fetch: (messageId) => ctx.client.messages.fetch(messageId, ctx.channelId),
            purge: (messages, reason) => ctx.client.messages.purge(messages, ctx.channelId, reason),
        };
    }
    static reactions(ctx) {
        return {
            add: (messageId, emoji) => ctx.client.reactions.add(messageId, ctx.channelId, emoji),
            delete: (messageId, emoji, userId = '@me') => ctx.client.reactions.delete(messageId, ctx.channelId, emoji, userId),
            fetch: (messageId, emoji, query) => ctx.client.reactions.fetch(messageId, ctx.channelId, emoji, query),
            purge: (messageId, emoji) => ctx.client.reactions.purge(messageId, ctx.channelId, emoji),
        };
    }
    static pins(ctx) {
        return {
            fetch: () => ctx.client.channels.pins(ctx.channelId),
            set: (messageId, reason) => ctx.client.channels.setPin(messageId, ctx.channelId, reason),
            delete: (messageId, reason) => ctx.client.channels.deletePin(messageId, ctx.channelId, reason),
        };
    }
    static transformMessageBody(body, files, self) {
        const poll = body.poll;
        const allow = {
            allowed_mentions: self.options?.allowedMentions,
            ...body,
            components: body.components?.map(x => (x instanceof builders_1.ActionRow ? x.toJSON() : x)) ?? undefined,
            embeds: body.embeds?.map(x => (x instanceof builders_1.Embed ? x.toJSON() : x)) ?? undefined,
            poll: poll ? (poll instanceof builders_1.PollBuilder ? poll.toJSON() : poll) : undefined,
        };
        if ('attachment' in body) {
            allow.attachments =
                body.attachments?.map((x, i) => ({
                    id: i,
                    ...(0, builders_1.resolveAttachment)(x),
                })) ?? undefined;
        }
        else if (files?.length) {
            allow.attachments = files?.map((x, id) => ({
                id,
                filename: x.name,
            }));
        }
        return allow;
    }
}
exports.MessagesMethods = MessagesMethods;
let TextBaseGuildChannel = class TextBaseGuildChannel extends BaseGuildChannel {
};
exports.TextBaseGuildChannel = TextBaseGuildChannel;
exports.TextBaseGuildChannel = TextBaseGuildChannel = __decorate([
    (0, ts_mixer_1.mix)(MessagesMethods)
], TextBaseGuildChannel);
function channelFrom(data, client) {
    switch (data.type) {
        case v10_1.ChannelType.GuildStageVoice:
            return transformers_1.Transformers.StageChannel(client, data);
        case v10_1.ChannelType.GuildMedia:
            return transformers_1.Transformers.MediaChannel(client, data);
        case v10_1.ChannelType.DM:
            return transformers_1.Transformers.DMChannel(client, data);
        case v10_1.ChannelType.GuildForum:
            return transformers_1.Transformers.ForumChannel(client, data);
        case v10_1.ChannelType.AnnouncementThread:
        case v10_1.ChannelType.PrivateThread:
        case v10_1.ChannelType.PublicThread:
            return transformers_1.Transformers.ThreadChannel(client, data);
        case v10_1.ChannelType.GuildDirectory:
            return transformers_1.Transformers.DirectoryChannel(client, data);
        case v10_1.ChannelType.GuildVoice:
            return transformers_1.Transformers.VoiceChannel(client, data);
        case v10_1.ChannelType.GuildText:
            return transformers_1.Transformers.TextGuildChannel(client, data);
        case v10_1.ChannelType.GuildCategory:
            return transformers_1.Transformers.CategoryChannel(client, data);
        case v10_1.ChannelType.GuildAnnouncement:
            return transformers_1.Transformers.NewsChannel(client, data);
        default:
            if ('guild_id' in data) {
                return transformers_1.Transformers.BaseGuildChannel(client, data);
            }
            return transformers_1.Transformers.BaseChannel(client, data);
    }
}
class TopicableGuildChannel extends DiscordBase_1.DiscordBase {
    setTopic(topic, reason) {
        return this.edit({ topic }, reason);
    }
}
exports.TopicableGuildChannel = TopicableGuildChannel;
let ThreadOnlyMethods = class ThreadOnlyMethods extends DiscordBase_1.DiscordBase {
    setTags(tags, reason) {
        return this.edit({ available_tags: tags }, reason);
    }
    setAutoArchiveDuration(duration, reason) {
        return this.edit({ default_auto_archive_duration: duration }, reason);
    }
    setReactionEmoji(emoji, reason) {
        return this.edit({ default_reaction_emoji: emoji }, reason);
    }
    setSortOrder(sort, reason) {
        return this.edit({ default_sort_order: sort }, reason);
    }
    setThreadRateLimit(rate, reason) {
        return this.edit({ default_thread_rate_limit_per_user: rate }, reason);
    }
    async thread(body, reason) {
        return this.client.channels.thread(this.id, body, reason);
    }
};
exports.ThreadOnlyMethods = ThreadOnlyMethods;
exports.ThreadOnlyMethods = ThreadOnlyMethods = __decorate([
    (0, ts_mixer_1.mix)(TopicableGuildChannel)
], ThreadOnlyMethods);
class VoiceChannelMethods extends DiscordBase_1.DiscordBase {
    guildId;
    setBitrate(bitrate, reason) {
        return this.edit({ bitrate }, reason);
    }
    setUserLimit(user_limit, reason) {
        return this.edit({ user_limit: user_limit ?? 0 }, reason);
    }
    setRTC(rtc_region, reason) {
        return this.edit({ rtc_region }, reason);
    }
    setVideoQuality(quality, reason) {
        return this.edit({ video_quality_mode: v10_1.VideoQualityMode[quality] }, reason);
    }
    setVoiceState(status = null) {
        return this.client.channels.setVoiceStatus(this.id, status);
    }
    async states() {
        if (!this.guildId)
            return [];
        const states = await this.cache.voiceStates?.values(this.guildId);
        if (!states?.length)
            return [];
        const filter = states.filter(state => state.channelId === this.id);
        return filter;
    }
    async members(force) {
        const collection = new __1.Collection();
        const states = await this.states();
        for (const state of states) {
            const member = await state.member(force);
            collection.set(member.id, member);
        }
        return collection;
    }
}
exports.VoiceChannelMethods = VoiceChannelMethods;
class WebhookGuildMethods extends DiscordBase_1.DiscordBase {
    webhooks = WebhookGuildMethods.guild({
        client: this.client,
        guildId: this.id,
    });
    static guild(ctx) {
        return {
            list: () => ctx.client.webhooks.listFromGuild(ctx.guildId),
        };
    }
}
exports.WebhookGuildMethods = WebhookGuildMethods;
class WebhookChannelMethods extends DiscordBase_1.DiscordBase {
    webhooks = WebhookChannelMethods.channel({
        client: this.client,
        channelId: this.id,
    });
    static channel(ctx) {
        return {
            list: () => ctx.client.webhooks.listFromChannel(ctx.channelId),
            create: async (body) => ctx.client.webhooks.create(ctx.channelId, body),
        };
    }
}
exports.WebhookChannelMethods = WebhookChannelMethods;
let TextGuildChannel = class TextGuildChannel extends BaseGuildChannel {
    setRatelimitPerUser(rate_limit_per_user) {
        return this.edit({ rate_limit_per_user });
    }
    setNsfw(nsfw = true, reason) {
        return this.edit({ nsfw }, reason);
    }
};
exports.TextGuildChannel = TextGuildChannel;
exports.TextGuildChannel = TextGuildChannel = __decorate([
    (0, ts_mixer_1.mix)(TextBaseGuildChannel, WebhookChannelMethods)
], TextGuildChannel);
let DMChannel = class DMChannel extends BaseChannel {
};
exports.DMChannel = DMChannel;
exports.DMChannel = DMChannel = __decorate([
    (0, ts_mixer_1.mix)(MessagesMethods)
], DMChannel);
let VoiceChannel = class VoiceChannel extends BaseChannel {
};
exports.VoiceChannel = VoiceChannel;
exports.VoiceChannel = VoiceChannel = __decorate([
    (0, ts_mixer_1.mix)(TextGuildChannel, WebhookChannelMethods, VoiceChannelMethods)
], VoiceChannel);
let StageChannel = class StageChannel extends BaseChannel {
};
exports.StageChannel = StageChannel;
exports.StageChannel = StageChannel = __decorate([
    (0, ts_mixer_1.mix)(TopicableGuildChannel, VoiceChannelMethods)
], StageChannel);
let MediaChannel = class MediaChannel extends BaseChannel {
};
exports.MediaChannel = MediaChannel;
exports.MediaChannel = MediaChannel = __decorate([
    (0, ts_mixer_1.mix)(ThreadOnlyMethods)
], MediaChannel);
let ForumChannel = class ForumChannel extends BaseChannel {
};
exports.ForumChannel = ForumChannel;
exports.ForumChannel = ForumChannel = __decorate([
    (0, ts_mixer_1.mix)(ThreadOnlyMethods, WebhookChannelMethods)
], ForumChannel);
let ThreadChannel = class ThreadChannel extends BaseChannel {
    webhooks = WebhookChannelMethods.channel({
        client: this.client,
        channelId: this.parentId,
    });
    async join() {
        await this.client.threads.join(this.id);
        return this;
    }
    async leave() {
        await this.client.threads.leave(this.id);
        return this;
    }
    setRatelimitPerUser(rate_limit_per_user) {
        return this.edit({ rate_limit_per_user });
    }
    pin(reason) {
        return this.edit({ flags: (this.flags ?? 0) | v10_1.ChannelFlags.Pinned }, reason);
    }
    unpin(reason) {
        return this.edit({ flags: (this.flags ?? 0) & ~v10_1.ChannelFlags.Pinned }, reason);
    }
    setTags(applied_tags, reason) {
        /**
         * The available_tags field can be set when creating or updating a channel.
         * Which determines which tags can be set on individual threads within the thread's applied_tags field.
         */
        return this.edit({ applied_tags }, reason);
    }
    setArchived(archived = true, reason) {
        return this.edit({ archived }, reason);
    }
    setAutoArchiveDuration(auto_archive_duration, reason) {
        return this.edit({ auto_archive_duration }, reason);
    }
    setInvitable(invitable = true, reason) {
        return this.edit({ invitable }, reason);
    }
    setLocked(locked = true, reason) {
        return this.edit({ locked }, reason);
    }
};
exports.ThreadChannel = ThreadChannel;
exports.ThreadChannel = ThreadChannel = __decorate([
    (0, ts_mixer_1.mix)(TextBaseGuildChannel)
], ThreadChannel);
class CategoryChannel extends BaseGuildChannel {
}
exports.CategoryChannel = CategoryChannel;
let NewsChannel = class NewsChannel extends BaseChannel {
    addFollower(webhookChannelId, reason) {
        return this.client.guilds.channels.addFollower(this.id, webhookChannelId, reason);
    }
};
exports.NewsChannel = NewsChannel;
exports.NewsChannel = NewsChannel = __decorate([
    (0, ts_mixer_1.mix)(WebhookChannelMethods)
], NewsChannel);
class DirectoryChannel extends BaseChannel {
}
exports.DirectoryChannel = DirectoryChannel;
