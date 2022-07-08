import type { DiscordEmbed, DiscordEmbedField, DiscordEmbedProvider } from "../../../discordeno/mod.ts";

export interface EmbedFooter {
    text: string;
    iconUrl?: string;
    proxyIconUrl?: string;
}

export interface EmbedAuthor {
    name: string;
    text?: string;
    url?: string;
    iconUrl?: string;
    proxyIconUrl?: string;
}

export interface EmbedVideo {
    height?: number;
    proxyUrl?: string;
    url?: string;
    width?: number;
}

export class EmbedBuilder {
    #data: DiscordEmbed;
    constructor(data: DiscordEmbed = {}) {
        this.#data = data;
        if (!this.#data.fields) this.#data.fields = [];
    }

    setAuthor(author: EmbedAuthor) {
        this.#data.author = {
            name: author.name,
            icon_url: author.iconUrl,
            proxy_icon_url: author.proxyIconUrl,
            url: author.url,
        };
        return this;
    }

    setColor(color: number) {
        this.#data.color = color;
        return this;
    }

    setDescription(description: string) {
        this.#data.description = description;
        return this;
    }

    addField(field: DiscordEmbedField) {
        this.#data.fields!.push(field);
        return this;
    }

    setFooter(footer: EmbedFooter) {
        this.#data.footer = {
            text: footer.text,
            icon_url: footer.iconUrl,
            proxy_icon_url: footer.proxyIconUrl,
        };
        return this;
    }

    setImage(image: string) {
        this.#data.image = { url: image };
        return this;
    }

    setProvider(provider: DiscordEmbedProvider) {
        this.#data.provider = provider;
        return this;
    }

    setThumbnail(thumbnail: string) {
        this.#data.thumbnail = { url: thumbnail };
        return this;
    }

    setTimestamp(timestamp: string | Date) {
        this.#data.timestamp = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
        return this;
    }

    setTitle(title: string, url?: string) {
        this.#data.title = title;
        if (url) this.setUrl(url);
        return this;
    }

    setUrl(url: string) {
        this.#data.url = url;
        return this;
    }

    setVideo(video: EmbedVideo) {
        this.#data.video = {
            height: video.height,
            proxy_url: video.proxyUrl,
            url: video.url,
            width: video.width,
        };
        return this;
    }

    toJSON(): DiscordEmbed {
        return this.#data;
    }
}
