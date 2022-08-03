import { DiscordEmbed, DiscordEmbedField, DiscordEmbedProvider } from '@biscuitland/api-types';

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

    setAuthor(author: EmbedAuthor): EmbedBuilder {
        this.#data.author = {
            name: author.name,
            icon_url: author.iconUrl,
            proxy_icon_url: author.proxyIconUrl,
            url: author.url,
        };
        return this;
    }

    setColor(color: number): EmbedBuilder {
        this.#data.color = color;
        return this;
    }

    setDescription(description: string): EmbedBuilder {
        this.#data.description = description;
        return this;
    }

    addField(field: DiscordEmbedField): EmbedBuilder {
        this.#data.fields!.push(field);
        return this;
    }

    setFooter(footer: EmbedFooter): EmbedBuilder {
        this.#data.footer = {
            text: footer.text,
            icon_url: footer.iconUrl,
            proxy_icon_url: footer.proxyIconUrl,
        };
        return this;
    }

    setImage(image: string): EmbedBuilder {
        this.#data.image = { url: image };
        return this;
    }

    setProvider(provider: DiscordEmbedProvider): EmbedBuilder {
        this.#data.provider = provider;
        return this;
    }

    setThumbnail(thumbnail: string): EmbedBuilder {
        this.#data.thumbnail = { url: thumbnail };
        return this;
    }

    setTimestamp(timestamp: string | Date): EmbedBuilder {
        this.#data.timestamp = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
        return this;
    }

    setTitle(title: string, url?: string): EmbedBuilder {
        this.#data.title = title;
        if (url) this.setUrl(url);
        return this;
    }

    setUrl(url: string): EmbedBuilder {
        this.#data.url = url;
        return this;
    }

    setVideo(video: EmbedVideo): EmbedBuilder {
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
