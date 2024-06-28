import type { UsingClient } from '../../commands';
import { Base } from './Base';
export declare class DiscordBase<Data extends Record<string, any> = {
    id: string;
}> extends Base {
    id: string;
    constructor(client: UsingClient, 
    /** Unique ID of the object */
    data: Data);
    /**
     * Create a timestamp for the current object.
     */
    get createdTimestamp(): number;
    /**
     * createdAt gets the creation Date instace of the current object.
     */
    get createdAt(): Date;
}
