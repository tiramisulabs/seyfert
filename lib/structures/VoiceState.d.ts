import type { UsingClient } from '../';
import type { VoiceStateResource } from '../cache/resources/voice-states';
import { type GuildMemberStructure } from '../client/transformers';
import type { ObjectToLower } from '../common';
import type { GatewayVoiceState } from '../types';
import { Base } from './extra/Base';
export interface VoiceState extends Base, ObjectToLower<Omit<VoiceStateResource, 'member'>> {
}
export declare class VoiceState extends Base {
    protected withMember?: GuildMemberStructure;
    constructor(client: UsingClient, data: GatewayVoiceState);
    isMuted(): boolean;
    member(force?: boolean): Promise<import("./GuildMember").GuildMember>;
    user(force?: boolean): Promise<import("./User").User>;
    channel(force?: boolean): Promise<import("./channels").BaseChannel<import("discord-api-types/payloads/v10/channel").ChannelType> | import("./channels").DMChannel | import("./channels").CategoryChannel | undefined>;
    setMute(mute?: boolean, reason?: string): Promise<import("./GuildMember").GuildMember>;
    setDeaf(deaf?: boolean, reason?: string): Promise<import("./GuildMember").GuildMember>;
    setSuppress(suppress?: boolean): Promise<void>;
    requestSpeak(date?: string | Date): Promise<undefined>;
    disconnect(reason?: string): Promise<import("./GuildMember").GuildMember>;
    setChannel(channel_id: null | string, reason?: string): Promise<import("./GuildMember").GuildMember>;
}
