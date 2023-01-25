import type { Session } from '../../session';
import type {
	APIGuild,
	GuildVerificationLevel,
	GuildSystemChannelFlags,
	ChannelType,
	VideoQualityMode,
	APIOverwrite,
	GuildDefaultMessageNotifications,
	GuildExplicitContentFilter,
	GuildFeature,
	APIChannel
} from 'discord-api-types/v10';
import { Guild } from '../Guild';

export class GuildManager {
	constructor(private readonly session: Session) {}

	async get(guildId: string): Promise<Guild | undefined> {
		const guild = this.session.api
			.guilds(guildId)
			.get<APIGuild>()
			.then(g => new Guild(this.session, g))
			.catch(_ => undefined);

		return guild;
	}

	async create(options: GuildCreateOptions): Promise<Guild> {
		const guild = this.session.api
			.guilds()
			.post<APIGuild>({ body: options })
			.then(g => new Guild(this.session, g));

		return guild;
	}

	async delete(guildId: string): Promise<void> {
		return this.session.api
			.guilds(guildId)
			.delete();
	}

	async edit(guildId: string, options: GuildEditOptions): Promise<Guild> {
		const guild = this.session.api
			.guilds(guildId)
			.patch<APIGuild>({ body: options })
			.then(g => new Guild(this.session, g));
		return guild;
	}

	async getChannels(guildId: string): Promise<APIChannel[]> { // TODO CHANNELS
		const channels = this.session.api
			.guilds(guildId)
			.channels
			.get<APIChannel[]>();

		return channels;
	}

	async createChannel(guildId: string, options: GuildCreateOptionsChannel): Promise<APIChannel> { // TODO CHANNELS
		const channel = this.session.api
			.guilds(guildId)
			.channels
			.post<APIChannel>({ body: options });

		return channel;
	}
}

export interface GuildCreateOptionsRole {
	id: string;
	name?: string;
	color?: number;
	hoist?: boolean;
	position?: number;
	permissions?: bigint;
	mentionable?: boolean;
	icon?: string;
	unicodeEmoji?: string | null;
}

export interface GuildCreateOptionsChannel {
	id?: string;
	parentId?: string;
	type?:
		| ChannelType.GuildText
		| ChannelType.GuildVoice
		| ChannelType.GuildCategory
		| ChannelType.GuildStageVoice
		| ChannelType.GuildForum;
	name: string;
	topic?: string | null;
	nsfw?: boolean;
	bitrate?: number;
	userLimit?: number;
	rtcRegion?: string | null;
	videoQualityMode?: VideoQualityMode;
	permissionOverwrites?: Required<APIOverwrite>[];
	rateLimitPerUser?: number;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#create-guild
 */
export interface GuildCreateOptions {
	name: string;
	region: string;
	icon?: string;
	verificationLevel?: GuildVerificationLevel;
	defaultMessageNotifications?: GuildDefaultMessageNotifications;
	explicitContentFilter?: GuildExplicitContentFilter;
	roles?: GuildCreateOptionsRole[];
	channels?: GuildCreateOptionsChannel;
	afkChannelId?: string;
	afkTimeout?: number;
	systemChannelId?: string;
	systemChannelFlags?: GuildSystemChannelFlags;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#modify-guild
 */
export interface GuildEditOptions extends Partial<GuildCreateOptions> {
	ownerId?: string;
	splash?: string;
	discoverySplash?: string;
	rulesChannelId?: string;
	publicUpdatesChannelId?: string;
	preferredLocale?: string;
	description?: string;
	premiumProgressBarEnabled?: boolean;
	features?: GuildFeature[];
}

/**
 * @link https://discord.com/developers/docs/resources/guild#create-guild-channel
 */
export interface GuildChannelCreateOptions extends Partial<GuildCreateOptionsChannel> {
	name: string;
}
