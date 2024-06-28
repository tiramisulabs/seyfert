"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceState = void 0;
const transformers_1 = require("../client/transformers");
const Base_1 = require("./extra/Base");
class VoiceState extends Base_1.Base {
    withMember;
    constructor(client, data) {
        super(client);
        const { member, ...rest } = data;
        this.__patchThis(rest);
        if (member?.user && data.guild_id)
            this.withMember = transformers_1.Transformers.GuildMember(client, member, member.user, data.guild_id);
    }
    isMuted() {
        return this.mute || this.selfMute;
    }
    async member(force) {
        return (this.withMember = await this.client.members.fetch(this.guildId, this.userId, force));
    }
    async user(force) {
        return this.client.users.fetch(this.userId, force);
    }
    async channel(force) {
        if (!this.channelId)
            return;
        return this.client.channels.fetch(this.channelId, force);
    }
    async setMute(mute = !this.mute, reason) {
        return this.client.members.edit(this.guildId, this.userId, { mute }, reason).then(member => {
            this.mute = mute;
            return member;
        });
    }
    async setDeaf(deaf = !this.deaf, reason) {
        return this.client.members.edit(this.guildId, this.userId, { deaf }, reason).then(member => {
            this.deaf = deaf;
            return member;
        });
    }
    async setSuppress(suppress = !this.suppress) {
        await this.client.proxy.guilds(this.guildId)['voice-states']['@me'].patch({
            body: { suppress },
        });
        this.suppress = suppress;
    }
    async requestSpeak(date = new Date()) {
        if (typeof date === 'string')
            date = new Date(date);
        if (Number.isNaN(date))
            return Promise.reject('Invalid date');
        date = date.toISOString();
        await this.client.proxy.guilds(this.guildId)['voice-states']['@me'].patch({
            body: { request_to_speak_timestamp: date },
        });
        this.requestToSpeakTimestamp = date;
    }
    async disconnect(reason) {
        return this.setChannel(null, reason);
    }
    async setChannel(channel_id, reason) {
        return this.client.members.edit(this.guildId, this.userId, { channel_id }, reason).then(member => {
            this.channelId = channel_id;
            return member;
        });
    }
}
exports.VoiceState = VoiceState;
