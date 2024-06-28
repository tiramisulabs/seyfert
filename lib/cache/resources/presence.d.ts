import type { GatewayPresenceUpdate } from 'discord-api-types/v10';
import { GuildRelatedResource } from './default/guild-related';
export declare class Presences extends GuildRelatedResource<PresenceResource, GatewayPresenceUpdate> {
    namespace: string;
    filter(data: GatewayPresenceUpdate, id: string, guild_id?: string): boolean;
    parse(data: any, key: string, guild_id: string): PresenceResource;
}
export type PresenceResource = Omit<GatewayPresenceUpdate, 'user'> & {
    id: string;
    user_id: string;
};
