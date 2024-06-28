"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transformers = void 0;
const commands_1 = require("../commands");
const structures_1 = require("../structures");
const GuildBan_1 = require("../structures/GuildBan");
class Transformers {
    static AnonymousGuild(...args) {
        return new structures_1.AnonymousGuild(...args);
    }
    static AutoModerationRule(...args) {
        return new structures_1.AutoModerationRule(...args);
    }
    static BaseChannel(...args) {
        return new structures_1.BaseChannel(...args);
    }
    static BaseGuildChannel(...args) {
        return new structures_1.BaseGuildChannel(...args);
    }
    static TextGuildChannel(...args) {
        return new structures_1.TextGuildChannel(...args);
    }
    static DMChannel(...args) {
        return new structures_1.DMChannel(...args);
    }
    static VoiceChannel(...args) {
        return new structures_1.VoiceChannel(...args);
    }
    static StageChannel(...args) {
        return new structures_1.StageChannel(...args);
    }
    static MediaChannel(...args) {
        return new structures_1.MediaChannel(...args);
    }
    static ForumChannel(...args) {
        return new structures_1.ForumChannel(...args);
    }
    static ThreadChannel(...args) {
        return new structures_1.ThreadChannel(...args);
    }
    static CategoryChannel(...args) {
        return new structures_1.CategoryChannel(...args);
    }
    static NewsChannel(...args) {
        return new structures_1.NewsChannel(...args);
    }
    static DirectoryChannel(...args) {
        return new structures_1.DirectoryChannel(...args);
    }
    static ClientUser(...args) {
        return new structures_1.ClientUser(...args);
    }
    static Guild(...args) {
        return new structures_1.Guild(...args);
    }
    static GuildBan(...args) {
        return new GuildBan_1.GuildBan(...args);
    }
    static GuildEmoji(...args) {
        return new structures_1.GuildEmoji(...args);
    }
    static GuildMember(...args) {
        return new structures_1.GuildMember(...args);
    }
    static InteractionGuildMember(...args) {
        return new structures_1.InteractionGuildMember(...args);
    }
    static GuildRole(...args) {
        return new structures_1.GuildRole(...args);
    }
    static GuildTemplate(...args) {
        return new structures_1.GuildTemplate(...args);
    }
    static Message(...args) {
        return new structures_1.Message(...args);
    }
    static WebhookMessage(...args) {
        return new structures_1.WebhookMessage(...args);
    }
    static Poll(...args) {
        return new structures_1.Poll(...args);
    }
    static Sticker(...args) {
        return new structures_1.Sticker(...args);
    }
    static User(...args) {
        return new structures_1.User(...args);
    }
    static VoiceState(...args) {
        return new structures_1.VoiceState(...args);
    }
    static Webhook(...args) {
        return new structures_1.Webhook(...args);
    }
    static OptionResolver(...args) {
        return new commands_1.OptionResolver(...args);
    }
}
exports.Transformers = Transformers;
