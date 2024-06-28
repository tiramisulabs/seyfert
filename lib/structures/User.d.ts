import type { APIUser } from 'discord-api-types/v10';
import { type MessageCreateBodyRequest, type ObjectToLower } from '../common';
import type { ImageOptions } from '../common/types/options';
import { DiscordBase } from './extra/DiscordBase';
export interface User extends ObjectToLower<APIUser> {
}
export declare class User extends DiscordBase<APIUser> {
    get tag(): string;
    get name(): string;
    /**
     * Fetch user
     */
    fetch(force?: boolean): Promise<User>;
    /**
     * Open a DM with the user
     */
    dm(force?: boolean): Promise<import("./channels").DMChannel>;
    write(body: MessageCreateBodyRequest): Promise<import("./Message").Message>;
    defaultAvatarURL(): string;
    avatarURL(options?: ImageOptions): string;
    avatarDecorationURL(options?: ImageOptions): string | undefined;
    bannerURL(options?: ImageOptions): string | undefined;
    presence(): import("..").ReturnCache<(Omit<import("discord-api-types/v10").GatewayPresenceUpdate, "user"> & {
        id: string;
        user_id: string;
    } & {
        guild_id: string;
    }) | undefined>;
    toString(): `<@${string}>`;
}
