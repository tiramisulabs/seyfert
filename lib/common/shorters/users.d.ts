import type { MessageCreateBodyRequest } from '../types/write';
import { BaseShorter } from './base';
export declare class UsersShorter extends BaseShorter {
    createDM(userId: string, force?: boolean): Promise<import("../../structures").DMChannel>;
    deleteDM(userId: string, reason?: string): Promise<import("../../structures").DMChannel>;
    fetch(userId: string, force?: boolean): Promise<import("../../structures").User>;
    raw(userId: string, force?: boolean): Promise<import("discord-api-types/v10").APIUser>;
    write(userId: string, body: MessageCreateBodyRequest): Promise<import("../../structures").Message>;
}
