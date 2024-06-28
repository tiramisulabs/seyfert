"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Guild = void 0;
const AutoModerationRule_1 = require("./AutoModerationRule");
const GuildEmoji_1 = require("./GuildEmoji");
const GuildMember_1 = require("./GuildMember");
const GuildRole_1 = require("./GuildRole");
const GuildTemplate_1 = require("./GuildTemplate");
const Sticker_1 = require("./Sticker");
const channels_1 = require("./channels");
const BaseGuild_1 = require("./extra/BaseGuild");
const GuildBan_1 = require("./GuildBan");
class Guild extends BaseGuild_1.BaseGuild {
    joinedAt;
    memberCount;
    large;
    unavailable;
    constructor(client, data) {
        super(client, data);
        if ('joined_at' in data) {
            this.joinedAt = Number(data.joined_at);
            this.memberCount = data.member_count;
            this.large = data.large;
            this.unavailable = data.unavailable;
        }
    }
    webhooks = channels_1.WebhookGuildMethods.guild({ client: this.client, guildId: this.id });
    get maxStickers() {
        switch (this.premiumTier) {
            case 1:
                return 15;
            case 2:
                return 30;
            case 3:
                return 60;
            default:
                return 5;
        }
    }
    get maxEmojis() {
        switch (this.premiumTier) {
            case 1:
                return 100;
            case 2:
                return 150;
            case 3:
                return 250;
            default:
                return 50;
        }
    }
    fetchOwner(force = false) {
        // For no reason, discord has some guilds without owner... 🤓
        if (!this.ownerId) {
            return Promise.resolve(null);
        }
        return this.members.fetch(this.ownerId, force);
    }
    templates = GuildTemplate_1.GuildTemplate.methods({ client: this.client, guildId: this.id });
    stickers = Sticker_1.Sticker.methods({ client: this.client, guildId: this.id });
    members = GuildMember_1.GuildMember.methods({ client: this.client, guildId: this.id });
    moderationRules = AutoModerationRule_1.AutoModerationRule.methods({ client: this.client, guildId: this.id });
    roles = GuildRole_1.GuildRole.methods({ client: this.client, guildId: this.id });
    channels = channels_1.BaseChannel.allMethods({ client: this.client, guildId: this.id });
    emojis = GuildEmoji_1.GuildEmoji.methods({ client: this.client, guildId: this.id });
    bans = GuildBan_1.GuildBan.methods({ client: this.client, guildId: this.id });
}
exports.Guild = Guild;
