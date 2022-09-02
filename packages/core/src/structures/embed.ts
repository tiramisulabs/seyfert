import type { DiscordEmbed, EmbedTypes } from '@biscuitland/api-types';

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
	fields?: {
		name: string;
		value: string;
		inline?: boolean;
	}[];
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

export function NewEmbed(data: Embed): DiscordEmbed {
	return {
		title: data.title,
		timestamp: data.timestamp,
		type: data.type,
		url: data.url,
		color: data.color,
		description: data.description,
		author: data.author && {
			name: data.author.name,
			url: data.author.url,
			icon_url: data.author.iconURL,
			proxy_icon_url: data.author.proxyIconURL,
		},
		footer: data.footer && {
			text: data.footer.text,
			icon_url: data.footer.iconURL,
			proxy_icon_url: data.footer.proxyIconURL,
		},
		fields: data.fields?.map(f => {
			return {
				name: f.name,
				value: f.value,
				inline: f.inline,
			};
		}),
		thumbnail: data.thumbnail && {
			url: data.thumbnail.url,
			proxy_url: data.thumbnail.proxyURL,
			width: data.thumbnail.width,
			height: data.thumbnail.height,
		},
		video: {
			url: data.video?.url,
			proxy_url: data.video?.proxyURL,
			width: data.video?.width,
			height: data.video?.height,
		},
		image: data.image && {
			url: data.image.url,
			proxy_url: data.image.proxyURL,
			width: data.image.width,
			height: data.image.height,
		},
		provider: {
			url: data.provider?.url,
			name: data.provider?.name,
		},
	};
}

export const embed = NewEmbed;

export function NewEmbedR(data: DiscordEmbed): Embed {
	return {
		title: data.title,
		timestamp: data.timestamp,
		type: data.type,
		url: data.url,
		color: data.color,
		description: data.description,
		author: data.author && {
			name: data.author.name,
			url: data.author.url,
			iconURL: data.author.icon_url,
			proxyIconURL: data.author.proxy_icon_url,
		},
		footer: data.footer && {
			text: data.footer.text,
			iconURL: data.footer.icon_url,
			proxyIconURL: data.footer.proxy_icon_url,
		},
		fields: data.fields?.map(f => {
			return {
				name: f.name,
				value: f.value,
				inline: f.inline,
			};
		}),
		thumbnail: data.thumbnail && {
			url: data.thumbnail.url,
			proxyURL: data.thumbnail.proxy_url,
			width: data.thumbnail.width,
			height: data.thumbnail.height,
		},
		video: {
			url: data.video?.url,
			proxyURL: data.video?.proxy_url,
			width: data.video?.width,
			height: data.video?.height,
		},
		image: data.image && {
			url: data.image.url,
			proxyURL: data.image.proxy_url,
			width: data.image.width,
			height: data.image.height,
		},
		provider: {
			url: data.provider?.url,
			name: data.provider?.name,
		},
	};
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const embed_ = NewEmbedR;
