import type { DiscordEmbed, EmbedTypes } from "../../discordeno/mod.ts";

export interface Embed {
    title?: string;
    timestamp?: string;
    type?: EmbedTypes;
    url?: string;
    color?: number;
    description?: string;
    author?: {
        name: string;
        iconURL?: string;
        proxyIconURL?: string;
        url?: string;
    };
    footer?: {
        text: string;
        iconURL?: string;
        proxyIconURL?: string;
    };
    fields?: Array<{
        name: string;
        value: string;
        inline?: boolean;
    }>;
    thumbnail?: {
        url: string;
        proxyURL?: string;
        width?: number;
        height?: number;
    };
    video?: {
        url?: string;
        proxyURL?: string;
        width?: number;
        height?: number;
    };
    image?: {
        url: string;
        proxyURL?: string;
        width?: number;
        height?: number;
    };
    provider?: {
        url?: string;
        name?: string;
    };
}

export function embed(data: Embed): DiscordEmbed {
    return {
        title: data.title,
        timestamp: data.timestamp,
        type: data.type,
        url: data.url,
        color: data.color,
        description: data.description,
        author: {
            name: data.author?.name!,
            url: data.author?.url,
            icon_url: data.author?.iconURL,
            proxy_icon_url: data.author?.proxyIconURL,
        },
        footer: data.footer || {
            text: data.footer!.text,
            icon_url: data.footer!.iconURL,
            proxy_icon_url: data.footer!.proxyIconURL,
        },
        fields: data.fields?.map((f) => {
            return {
                name: f.name,
                value: f.value,
                inline: f.inline,
            };
        }),
        thumbnail: data.thumbnail || {
            url: data.thumbnail!.url,
            proxy_url: data.thumbnail!.proxyURL,
            width: data.thumbnail!.width,
            height: data.thumbnail!.height,
        },
        video: {
            url: data.video?.url,
            proxy_url: data.video?.proxyURL,
            width: data.video?.width,
            height: data.video?.height,
        },
        image: data.image || {
            url: data.image!.url,
            proxy_url: data.image!.proxyURL,
            width: data.image!.width,
            height: data.image!.height,
        },
        provider: {
            url: data.provider?.url,
            name: data.provider?.name,
        },
    };
}

export default Embed;
