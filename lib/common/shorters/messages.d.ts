import type { RESTPostAPIChannelMessagesThreadsJSONBody } from 'discord-api-types/v10';
import type { MessageCreateBodyRequest, MessageUpdateBodyRequest } from '../types/write';
import { BaseShorter } from './base';
import type { ValidAnswerId } from '../../api/Routes/channels';
export declare class MessageShorter extends BaseShorter {
    write(channelId: string, { files, ...body }: MessageCreateBodyRequest): Promise<import("../../structures").Message>;
    edit(messageId: string, channelId: string, { files, ...body }: MessageUpdateBodyRequest): Promise<import("../../structures").Message>;
    crosspost(messageId: string, channelId: string, reason?: string): Promise<import("../../structures").Message>;
    delete(messageId: string, channelId: string, reason?: string): Promise<void>;
    fetch(messageId: string, channelId: string): Promise<import("../../structures").Message>;
    purge(messages: string[], channelId: string, reason?: string): Promise<void | undefined>;
    thread(channelId: string, messageId: string, options: RESTPostAPIChannelMessagesThreadsJSONBody & {
        reason?: string;
    }): Promise<import("../../structures").ThreadChannel>;
    endPoll(channelId: string, messageId: string): Promise<import("../../structures").Message>;
    getAnswerVoters(channelId: string, messageId: string, answerId: ValidAnswerId): Promise<import("../../structures").User[]>;
}
