import type { ButtonBuilder, InputTextBuilder, SelectMenuBuilder } from "./mod.ts";
import type { Permissions } from "./structures/Permissions.ts";
import type { Snowflake } from "./Snowflake.ts";

/*
 * Represents a session's cache
 * */
export interface SymCache {
    readonly cache: symbol;
}

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

/***
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
export type ImageFormat = "jpg" | "jpeg" | "png" | "webp" | "gif" | "json";

/**
 * @link https://discord.com/developers/docs/reference#image-formatting
 */
export type ImageSize = 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;

/**
 * Utility functions
 */
export class Util {
    static formatImageURL(url: string, size: ImageSize = 128, format?: ImageFormat) {
        return `${url}.${format || (url.includes("/a_") ? "gif" : "jpg")}?size=${size}`;
    }

    static iconHashToBigInt(hash: string) {
        return BigInt("0x" + (hash.startsWith("a_") ? `a${hash.substring(2)}` : `b${hash}`));
    }

    static iconBigintToHash(icon: bigint) {
        const hash = icon.toString(16);

        return hash.startsWith("a") ? `a_${hash.substring(1)}` : hash.substring(1);
    }
}

export default Util;
