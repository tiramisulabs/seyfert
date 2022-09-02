import type { Embed } from '@biscuitland/core';

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

export interface EmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

export interface EmbedProvider {
    url?: string;
    name?: string;
}

export class EmbedBuilder {
    #data: Embed;
    constructor(data: Embed = {}) {
        this.#data = data;
        if (!this.#data.fields) { this.#data.fields = []; }
    }

    setAuthor(author: EmbedAuthor): EmbedBuilder {
        this.#data.author = author;
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

    addField(field: EmbedField): EmbedBuilder {
        this.#data.fields!.push(field);
        return this;
    }

    setFooter(footer: EmbedFooter): EmbedBuilder {
        this.#data.footer = footer;
        return this;
    }

    setImage(image: string): EmbedBuilder {
        this.#data.image = { url: image };
        return this;
    }

    setProvider(provider: EmbedProvider): EmbedBuilder {
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
        if (url) { this.setUrl(url); }
        return this;
    }

    setUrl(url: string): EmbedBuilder {
        this.#data.url = url;
        return this;
    }

    setVideo(video: EmbedVideo): EmbedBuilder {
        this.#data.video = video;
        return this;
    }

    toJSON(): Embed {
        return this.#data;
    }
}
