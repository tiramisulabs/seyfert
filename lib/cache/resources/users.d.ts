import type { APIUser } from 'discord-api-types/v10';
import type { ReturnCache } from '../..';
import { BaseResource } from './default/base';
import { type UserStructure } from '../../client/transformers';
export declare class Users extends BaseResource<any, APIUser> {
    namespace: string;
    filter(data: APIUser, id: string): boolean;
    raw(id: string): ReturnCache<APIUser | undefined>;
    get(id: string): ReturnCache<UserStructure | undefined>;
    bulk(ids: string[]): ReturnCache<UserStructure[]>;
    bulkRaw(ids: string[]): ReturnCache<APIUser[]>;
    values(): ReturnCache<UserStructure[]>;
    valuesRaw(): ReturnCache<APIUser[]>;
}
