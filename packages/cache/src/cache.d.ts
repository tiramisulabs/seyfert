import type { CacheOptions, CO } from './types';
import { MemoryCacheAdapter } from './scheme/adapters/memory-cache-adapter';
import { ChannelResource, GuildEmojiResource, GuildMemberResource, GuildResource, GuildRoleResource, GuildStickerResource, GuildVoiceResource, PresenceResource, UserResource } from './resources';
export declare class Cache {
    #private;
    static readonly DEFAULTS: {
        adapter: MemoryCacheAdapter;
    };
    readonly options: CO;
    readonly channels: ChannelResource;
    readonly emojis: GuildEmojiResource;
    readonly members: GuildMemberResource;
    readonly guilds: GuildResource;
    readonly roles: GuildRoleResource;
    readonly stickers: GuildStickerResource;
    readonly voices: GuildVoiceResource;
    readonly presences: PresenceResource;
    readonly users: UserResource;
    constructor(options: CacheOptions);
    /**
     * @inheritDoc
     */
    start(event: any): Promise<void>;
}
