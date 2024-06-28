import type { GatewayVoiceState } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { GuildBasedResource } from './default/guild-based';
import { type VoiceStateStructure } from '../../client/transformers';
export declare class VoiceStates extends GuildBasedResource<any, GatewayVoiceState> {
    namespace: string;
    filter(data: GatewayVoiceState, id: string, guild_id: string): boolean;
    parse(data: any, id: string, guild_id: string): any;
    get(memberId: string, guildId: string): ReturnCache<VoiceStateStructure | undefined>;
    bulk(ids: string[], guild: string): ReturnCache<VoiceStateStructure[]>;
    values(guildId: string): ReturnCache<VoiceStateStructure[]>;
}
export type VoiceStateResource = Omit<GatewayVoiceState, 'member'> & {
    guild_id: string;
};
