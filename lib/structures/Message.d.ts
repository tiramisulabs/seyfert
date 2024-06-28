import type { APIChannelMention, APIEmbed, APIMessage, GatewayMessageCreateDispatchData } from 'discord-api-types/v10';
import type { ListenerOptions } from '../builders';
import type { UsingClient } from '../commands';
import { type ObjectToLower } from '../common';
import type { EmojiResolvable } from '../common/types/resolvables';
import type { MessageCreateBodyRequest, MessageUpdateBodyRequest } from '../common/types/write';
import type { ActionRowMessageComponents } from '../components';
import { MessageActionRowComponent } from '../components/ActionRow';
import type { MessageWebhookMethodEditParams, MessageWebhookMethodWriteParams } from './Webhook';
import { DiscordBase } from './extra/DiscordBase';
import { Embed } from '..';
import { type PollStructure, type GuildMemberStructure, type UserStructure } from '../client/transformers';
export type MessageData = APIMessage | GatewayMessageCreateDispatchData;
export interface BaseMessage extends DiscordBase, ObjectToLower<Omit<MessageData, 'timestamp' | 'author' | 'mentions' | 'components' | 'poll' | 'embeds'>> {
    timestamp?: number;
    guildId?: string;
    author: UserStructure;
    member?: GuildMemberStructure;
    components: MessageActionRowComponent<ActionRowMessageComponents>[];
    poll?: PollStructure;
    mentions: {
        roles: string[];
        channels: APIChannelMention[];
        users: (GuildMemberStructure | UserStructure)[];
    };
}
export declare class BaseMessage extends DiscordBase {
    embeds: InMessageEmbed[];
    constructor(client: UsingClient, data: MessageData);
    get user(): import("./User").User;
    createComponentCollector(options?: ListenerOptions): {
        run<T extends import("../components/handler").CollectorInteraction = import("../components/handler").CollectorInteraction>(customId: string | string[] | RegExp, callback: import("..").ComponentCallback<T>): any;
        stop(reason?: string): any;
    };
    get url(): string;
    guild(force?: boolean): Promise<import("./Guild").Guild<"api">> | undefined;
    channel(force?: boolean): Promise<import("./channels").AllChannels>;
    react(emoji: EmojiResolvable): Promise<void>;
    private patch;
}
export interface Message extends BaseMessage, ObjectToLower<Omit<MessageData, 'timestamp' | 'author' | 'mentions' | 'components' | 'poll' | 'embeds'>> {
}
export declare class Message extends BaseMessage {
    constructor(client: UsingClient, data: MessageData);
    fetch(): Promise<Message>;
    reply(body: Omit<MessageCreateBodyRequest, 'message_reference'>, fail?: boolean): Promise<Message>;
    edit(body: MessageUpdateBodyRequest): Promise<Message>;
    write(body: MessageCreateBodyRequest): Promise<Message>;
    delete(reason?: string): Promise<void>;
    crosspost(reason?: string): Promise<Message>;
}
export type EditMessageWebhook = Omit<MessageWebhookMethodEditParams, 'messageId'>['body'] & Pick<MessageWebhookMethodEditParams, 'query'>;
export type WriteMessageWebhook = MessageWebhookMethodWriteParams['body'] & Pick<MessageWebhookMethodWriteParams, 'query'>;
export declare class WebhookMessage extends BaseMessage {
    readonly webhookId: string;
    readonly webhookToken: string;
    constructor(client: UsingClient, data: MessageData, webhookId: string, webhookToken: string);
    fetch(): Promise<import("discord-api-types/v10").RESTGetAPIWebhookWithTokenResult>;
    edit(body: EditMessageWebhook): Promise<WebhookMessage>;
    write(body: WriteMessageWebhook): Promise<WebhookMessage | null>;
    delete(reason?: string): Promise<never>;
}
export declare class InMessageEmbed {
    data: APIEmbed;
    constructor(data: APIEmbed);
    get title(): string | undefined;
    /**
     * @deprecated
     */
    get type(): import("discord-api-types/v10").EmbedType | undefined;
    get description(): string | undefined;
    get url(): string | undefined;
    get timestamp(): string | undefined;
    get color(): number | undefined;
    get footer(): {
        text: string;
        iconUrl?: string | undefined;
        proxyIconUrl?: string | undefined;
    } | undefined;
    get image(): {
        url: string;
        proxyUrl?: string | undefined;
        height?: number | undefined;
        width?: number | undefined;
    } | undefined;
    get thumbnail(): {
        url: string;
        proxyUrl?: string | undefined;
        height?: number | undefined;
        width?: number | undefined;
    } | undefined;
    get video(): {
        url?: string | undefined;
        proxyUrl?: string | undefined;
        height?: number | undefined;
        width?: number | undefined;
    } | undefined;
    get provider(): import("discord-api-types/v10").APIEmbedProvider | undefined;
    get author(): {
        name: string;
        url?: string | undefined;
        iconUrl?: string | undefined;
        proxyIconUrl?: string | undefined;
    } | undefined;
    get fields(): import("discord-api-types/v10").APIEmbedField[] | undefined;
    toBuilder(): Embed;
    toJSON(): {
        title?: string;
        type?: import("discord-api-types/v10").EmbedType;
        description?: string;
        url?: string;
        timestamp?: string;
        color?: number;
        footer?: import("discord-api-types/v10").APIEmbedFooter;
        image?: import("discord-api-types/v10").APIEmbedImage;
        thumbnail?: import("discord-api-types/v10").APIEmbedThumbnail;
        video?: import("discord-api-types/v10").APIEmbedVideo;
        provider?: import("discord-api-types/v10").APIEmbedProvider;
        author?: import("discord-api-types/v10").APIEmbedAuthor;
        fields?: import("discord-api-types/v10").APIEmbedField[];
    };
}
