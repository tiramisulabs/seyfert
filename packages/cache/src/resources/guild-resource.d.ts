/**
 * refactor
 */
import type { CacheAdapter } from '../scheme/adapters/cache-adapter';
import type { DiscordGuild } from '@biscuitland/api-types';
import { ChannelResource } from './channel-resource';
import { GuildEmojiResource } from './guild-emoji-resource';
import { GuildMemberResource } from './guild-member-resource';
import { GuildRoleResource } from './guild-role-resource';
import { GuildStickerResource } from './guild-sticker-resource';
import { GuildVoiceResource } from './guild-voice-resource';
import { PresenceResource } from './presence-resource';
import { BaseResource } from './base-resource';
/**
 * Resource represented by an guild of discord
 */
export declare class GuildResource extends BaseResource<DiscordGuild> {
    #private;
    constructor(adapter: CacheAdapter, entity?: DiscordGuild | null, parent?: string, channels?: ChannelResource, emojis?: GuildEmojiResource, members?: GuildMemberResource, roles?: GuildRoleResource, stickers?: GuildStickerResource, voices?: GuildVoiceResource, presences?: PresenceResource);
    /**
     * @inheritDoc
     */
    get(id: string): Promise<GuildResource | null>;
    /**
     * @inheritDoc
     */
    set(id: string, data: any): Promise<void>;
    /**
     * @inheritDoc
     */
    items(): Promise<GuildResource[]>;
    /**
     * @inheritDoc
     */
    count(): Promise<number>;
    /**
     * @inheritDoc
     */
    remove(id: string): Promise<void>;
    /**
     * @inheritDoc
     */
    contains(id: string): Promise<boolean>;
    /**
     * @inheritDoc
     */
    getToRelationship(): Promise<string[]>;
    /**
     * @inheritDoc
     */
    addToRelationship(id: string): Promise<void>;
    /**
     * @inheritDoc
     */
    removeToRelationship(id: string): Promise<void>;
    /**
     * @inheritDoc
     */
    getEmojis(): Promise<GuildEmojiResource[]>;
    /**
     * @inheritDoc
     */
    getMembers(): Promise<GuildMemberResource[]>;
    /**
     * @inheritDoc
     */
    getRoles(): Promise<GuildRoleResource[]>;
    /**
     * @inheritDoc
     */
    getStickers(): Promise<GuildStickerResource[]>;
    /**
     * @inheritDoc
     */
    getVoiceStates(): Promise<GuildVoiceResource[]>;
}
