import type { Snowflake } from '../common';
import { baseEndpoints as Endpoints } from './constants';

export function USER_AVATAR(userId: Snowflake, icon: string): string {
    return `${Endpoints.CDN_URL}/avatars/${userId}/${icon}`;
}

export function EMOJI_URL(id: Snowflake, animated = false): string {
    return `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}`;
}

export function USER_DEFAULT_AVATAR(
    /** user discriminator */
    altIcon: number,
): string {
    return `${Endpoints.CDN_URL}/embed/avatars/${altIcon}.png`;
}

export function GUILD_BANNER(guildId: Snowflake, icon: string): string {
    return `${Endpoints.CDN_URL}/banners/${guildId}/${icon}`;
}

export function GUILD_SPLASH(guildId: Snowflake, icon: string): string {
    return `${Endpoints.CDN_URL}/splashes/${guildId}/${icon}`;
}

export function GUILD_ICON(guildId: Snowflake, icon: string): string {
    return `${Endpoints.CDN_URL}/icons/${guildId}/${icon}`;
}
