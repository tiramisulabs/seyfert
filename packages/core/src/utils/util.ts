import type { SelectMenuBuilder, InputTextBuilder, ButtonBuilder } from '@biscuitland/helpers';
import type { Permissions } from '../structures/special/permissions';
import type { Snowflake } from '../snowflakes';
import type { DiscordMessage, MakeRequired } from '@biscuitland/api-types';

/*
 * @link https://discord.com/developers/docs/resources/channel#message-object-message-flags
 */
export enum MessageFlags {
    /** this message has been published to subscribed channels (via Channel Following) */
    CrossPosted = 1 << 0,
    /** this message originated from a message in another channel (via Channel Following) */
    IsCrosspost = 1 << 1,
    /** do not include any embeds when serializing this message */
    SupressEmbeds = 1 << 2,
    /** the source message for this crosspost has been deleted (via Channel Following) */
    SourceMessageDeleted = 1 << 3,
    /** this message came from the urgent message system */
    Urgent = 1 << 4,
    /** this message has an associated thread, with the same id as the message */
    HasThread = 1 << 5,
    /** this message is only visible to the user who invoked the Interaction */
    Ephemeral = 1 << 6,
    /** this message is an Interaction Response and the bot is "thinking" */
    Loading = 1 << 7,
    /** this message failed to mention some roles and add their members to the thread */
    FailedToMentionSomeRolesInThread = 1 << 8,
}

export type ComponentBuilder =
    | InputTextBuilder
    | SelectMenuBuilder
    | ButtonBuilder;

/** *
 * Utility type
 */
export type ComponentEmoji = {
    id: Snowflake;
    name: string;
    animated?: boolean;
};

/**
 * Utility type
 */
export interface PermissionsOverwrites {
    id: Snowflake;
    type: 0 | 1;
    allow: Permissions;
    deny: Permissions;
}

/**
 * @link https://discord.com/developers/docs/reference#image-formatting
 */
export type ImageFormat = 'jpg' | 'jpeg' | 'png' | 'webp' | 'gif' | 'json';

/**
 * @link https://discord.com/developers/docs/reference#image-formatting
 */
export type ImageSize = 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;

/**
 * Utility functions
 */
export abstract class Util {
    static formatImageURL(url: string, size: ImageSize = 128, format?: ImageFormat): string {
        return `${url}.${format ?? (url.includes('/a_') ? 'gif' : 'jpg')}?size=${size}`;
    }

    static iconHashToBigInt(hash: string): bigint {
        return BigInt('0x' + (hash.startsWith('a_') ? `a${hash.substring(2)}` : `b${hash}`));
    }

    static iconBigintToHash(icon: bigint): string {
        const hash: string = icon.toString(16);

        return hash.startsWith('a') ? `a_${hash.substring(1)}` : hash.substring(1);
    }

    /** Removes the Bot before the token. */
    static removeTokenPrefix(token?: string, type: 'GATEWAY' | 'REST' = 'REST'): string {
        // If no token is provided, throw an error
        if (!token) { throw new Error(`The ${type} was not given a token. Please provide a token and try again.`); }

        // If the token does not have a prefix just return token
        if (!token.startsWith('Bot ')) { return token; }

        // Remove the prefix and return only the token.
        return token.substring(token.indexOf(' ') + 1);
    }

    /** Get the bot id from the bot token. WARNING: Discord staff has mentioned this may not be stable forever. Use at your own risk. However, note for over 5 years this has never broken. */
    static getBotIdFromToken(token: string): string {
        return atob(token.split('.')[0]);
    }

    static isFullMessage(m: Partial<DiscordMessage> | DiscordMessage): m is DiscordMessage {
        return !!m.edited_timestamp;
    }

    static isPartialMessage(m: Partial<DiscordMessage> | DiscordMessage): m is PartialMessage {
        return !m.edited_timestamp;
    }
}

export type PartialMessage = MakeRequired<DiscordMessage, "id" | "channel_id">;
