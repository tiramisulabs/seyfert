import type { APIPoll } from 'discord-api-types/v10';
import { type ObjectToLower } from '../common';
import { Base } from './extra/Base';
import type { UsingClient } from '../commands';
import type { ValidAnswerId } from '../api/Routes/channels';
export interface Poll extends ObjectToLower<Omit<APIPoll, 'expiry'>> {
}
export declare class Poll extends Base {
    readonly channelId: string;
    readonly messageId: string;
    expiry: number;
    constructor(client: UsingClient, data: APIPoll, channelId: string, messageId: string);
    end(): Promise<import("./Message").Message>;
    getAnswerVoters(id: ValidAnswerId): Promise<import("./User").User[]>;
}
