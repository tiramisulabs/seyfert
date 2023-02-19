import type { Session } from "../../session";
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
	APIChannel,
	APIThreadList,
	APIBan,
	GuildMFALevel,
	APIRole,
} from "discord-api-types/v10";
import { Guild } from "../Guild";

export class GuildManager {
	readonly session!: Session;
	constructor(session: Session) {
		Object.defineProperty(this, "session", {
			value: session,
			writable: false,
		});
	}

	async get(guildId: string): Promise<Guild | undefined> {
		return this.session.api
			.guilds(guildId)
			.get<APIGuild>()
			.then((g) => new Guild(this.session, g));
	}

	async create(options: GuildCreateOptions): Promise<Guild> {
		return this.session.api
			.guilds()
			.post<APIGuild>({ body: options })
			.then((g) => new Guild(this.session, g));
	}

	async delete(guildId: string): Promise<void> {
		return this.session.api.guilds(guildId).delete();
	}

	async edit(guildId: string, options: GuildEditOptions): Promise<Guild> {
		return this.session.api
			.guilds(guildId)
			.patch<APIGuild>({ body: options })
			.then((g) => new Guild(this.session, g));
	}

	async getChannels(guildId: string): Promise<APIChannel[]> {
		// TODO CHANNELS
		return this.session.api.guilds(guildId).channels.get<APIChannel[]>();
	}

	async createChannel(guildId: string, options: GuildCreateOptionsChannel): Promise<APIChannel> {
		// TODO CHANNELS
		return this.session.api.guilds(guildId).channels.post<APIChannel>({ body: options });
	}

	async editChannelPositions(guildId: string, options: GuildChannelEditPositionOptions[]): Promise<void> {
		return this.session.api.guilds(guildId).channels.patch<void>({ body: options });
	}

	async getActiveThreads(guildId: string): Promise<APIThreadList[]> {
		const threads = this.session.api.guilds(guildId).threads().active.get<APIThreadList[]>();

		return threads;
	}

	async getBans(guildId: string, query?: { limit?: number; before?: string; after?: string }): Promise<APIBan[]> {
		return this.session.api
			.guilds(guildId)
			.bans()
			.get<APIBan[]>({
				query: new URLSearchParams({ ...query, limit: String(query?.limit) }),
			});
	}

	async getBan(guildId: string, userId: string): Promise<APIBan> {
		return this.session.api
			.guilds(guildId)
			.bans(userId) // free was here :D
			.get<APIBan>();
	}

	async createBan(guildId: string, userId: string, options: GuildBanCreateOptions): Promise<void> {
		return this.session.api.guilds(guildId).bans(userId).put<void>({ body: options });
	}

	async removeBan(guildId: string, userId: string): Promise<void> {
		return this.session.api.guilds(guildId).bans(userId).delete();
	}

	async getRoles(guildId: string): Promise<APIRole[]> {
		return this.session.api.guilds(guildId).roles().get<APIRole[]>();
	}

	async createRole(guildId: string, options: GuildRoleCreate): Promise<APIRole> {
		return this.session.api.guilds(guildId).roles().post<APIRole>({ body: options });
	}

	async editRolePositions(guildId: string, options: GuildRoleEditPositionOptions[]): Promise<APIRole[]> {
		return this.session.api.guilds(guildId).roles().patch<APIRole[]>({ body: options });
	}

	async editRole(guildId: string, roleId: string, options: GuildRoleCreate): Promise<APIRole> {
		return this.session.api.guilds(guildId).roles(roleId).patch<APIRole>({ body: options });
	}

	async modifyGuildMFALevel(guildId: string, level: GuildMFALevel): Promise<void> {
		return this.session.api.guilds(guildId).mfa(level).post<void>();
	}

	async deleteRole(guildId: string, roleId: string): Promise<void> {
		return this.session.api.guilds(guildId).roles(roleId).delete();
	}

	async getPruneCount(guildId: string, options: GuildPruneCountOptions): Promise<number> {
		return this.session.api.guilds(guildId).prune.get<number>({ query: this.session.utils.objectToParams(options) });
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

/**
 * @link https://discord.com/developers/docs/resources/guild#modify-guild-channel-positions
 */
export interface GuildChannelEditPositionOptions {
	id: string;
	position: number;
	lockPermissions?: boolean;
	parentId?: string;
}

export interface GuildBanCreateOptions {
	deleteMessageDays?: number;
	deleteMessageSeconds?: number;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#create-guild-role
 */
export interface GuildRoleCreate {
	name?: string;
	permissions?: bigint;
	color?: number;
	hoist?: boolean;
	icon?: string;
	unicodeEmoji?: string;
	mentionable?: boolean;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#modify-guild-role-positions
 */
export interface GuildRoleEditPositionOptions {
	id: string;
	position: number;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#get-guild-prune-count
 */
export interface GuildPruneCountOptions {
	days: number;
	includeRoles?: string;
}
