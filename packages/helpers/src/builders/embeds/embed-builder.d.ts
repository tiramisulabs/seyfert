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
export declare class EmbedBuilder {
    #private;
    constructor(data?: Embed);
    setAuthor(author: EmbedAuthor): EmbedBuilder;
    setColor(color: number): EmbedBuilder;
    setDescription(description: string): EmbedBuilder;
    addField(field: EmbedField): EmbedBuilder;
    setFooter(footer: EmbedFooter): EmbedBuilder;
    setImage(image: string): EmbedBuilder;
    setProvider(provider: EmbedProvider): EmbedBuilder;
    setThumbnail(thumbnail: string): EmbedBuilder;
    setTimestamp(timestamp: string | Date): EmbedBuilder;
    setTitle(title: string, url?: string): EmbedBuilder;
    setUrl(url: string): EmbedBuilder;
    setVideo(video: EmbedVideo): EmbedBuilder;
    toJSON(): Embed;
}
