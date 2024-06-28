import type { APIStageInstance } from 'discord-api-types/v10';
import { GuildRelatedResource } from './default/guild-related';
export declare class StageInstances extends GuildRelatedResource<APIStageInstance, APIStageInstance> {
    namespace: string;
    filter(data: APIStageInstance, id: string, guild_id?: string): boolean;
}
