import type { APIMessage } from 'discord-api-types/v10';
import { GuildRelatedResource } from './default/guild-related';
import type { MessageData, ReturnCache } from '../..';
import { type MessageStructure } from '../../client/transformers';
export declare class Messages extends GuildRelatedResource<any, APIMessage> {
    namespace: string;
    filter(data: MessageData, id: string, channel_id?: string): boolean;
    parse(data: any, _key: string, _channel_id: string): any;
    get(id: string): ReturnCache<MessageStructure | undefined>;
    bulk(ids: string[]): ReturnCache<MessageStructure[]>;
    values(channel: string): ReturnCache<MessageStructure[]>;
    keys(channel: string): string[];
}
export type APIMessageResource = Omit<APIMessage, 'author'> & {
    user_id?: string;
};
