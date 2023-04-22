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
	APIThreadList,
	APIBan,
	GuildMFALevel,
	APIRole,
	APIVoiceRegion,
	APIInvite,
	APIGuildIntegration,
	APIGuildWidget,
	APIGuildWelcomeScreen,
	APIGuildChannel,
	GuildChannelType,
	ObjectToSnake,
} from "@biscuitland/common";
import { objectToParams } from "../../utils/utils";

export class GuildManager {
	readonly session!: Session;
	constructor(session: Session) {
		Object.defineProperty(this, "session", {
			value: session,
			writable: false,
		});
	}

	async get(guildId: string) {
		return this.session.api.guilds(guildId).get<APIGuild>();
	}

	async create(options: ObjectToSnake<GuildCreateOptions>) {
		return this.session.api.guilds().post<APIGuild>({ body: options });
	}

	async delete(guildId: string) {
		return this.session.api.guilds(guildId).delete();
	}

	async edit(guildId: string, options: ObjectToSnake<GuildEditOptions>) {
		return this.session.api.guilds(guildId).patch<APIGuild>({ body: options });
	}

	async getChannels(guildId: string) {
		return this.session.api.guilds(guildId).channels.get<APIGuildChannel<GuildChannelType>[]>();
	}

	async createChannel(guildId: string, options: ObjectToSnake<GuildCreateOptionsChannel>) {
		return this.session.api.guilds(guildId).channels.post<APIGuildChannel<GuildChannelType>[]>({ body: options });
	}

	async editChannelPositions(
		guildId: string,
		options: ObjectToSnake<GuildChannelEditPositionOptions>[],
	): Promise<void> {
		return this.session.api.guilds(guildId).channels.patch<void>({ body: options });
	}

	async getActiveThreads(guildId: string) {
		return this.session.api.guilds(guildId).threads().active.get<APIThreadList[]>();
	}

	async getBans(guildId: string, query: { limit?: number; before?: string; after?: string } = {}) {
		return this.session.api
			.guilds(guildId)
			.bans()
			.get<APIBan[]>({
				query: objectToParams(query),
			});
	}

	async getBan(guildId: string, userId: string) {
		return this.session.api.guilds(guildId).bans(userId).get<APIBan>();
	}

	async createBan(guildId: string, userId: string, options: ObjectToSnake<GuildBanCreateOptions>) {
		return this.session.api.guilds(guildId).bans(userId).put<void>({ body: options });
	}

	async removeBan(guildId: string, userId: string) {
		return this.session.api.guilds(guildId).bans(userId).delete();
	}

	async getRoles(guildId: string) {
		return this.session.api.guilds(guildId).roles().get<APIRole[]>();
	}

	async createRole(guildId: string, options: ObjectToSnake<GuildRoleCreate>) {
		return this.session.api.guilds(guildId).roles().post<APIRole>({ body: options });
	}

	async editRolePositions(guildId: string, options: ObjectToSnake<GuildRoleEditPositionOptions>[]) {
		return this.session.api.guilds(guildId).roles().patch<APIRole[]>({ body: options });
	}

	async editRole(guildId: string, roleId: string, options: ObjectToSnake<GuildRoleCreate>) {
		return this.session.api.guilds(guildId).roles(roleId).patch<APIRole>({ body: options });
	}

	async deleteRole(guildId: string, roleId: string) {
		return this.session.api.guilds(guildId).roles(roleId).delete();
	}

	async modifyGuildMFALevel(guildId: string, level: GuildMFALevel) {
		return this.session.api.guilds(guildId).mfa(level).post<void>();
	}

	async getPruneCount(guildId: string, options: ObjectToSnake<GuildPruneCountOptions>) {
		return this.session.api.guilds(guildId).prune.get<number>({ query: objectToParams(options) });
	}

	async beginGuildPrune(guildId: string, options: ObjectToSnake<GuildPruneOptions>): Promise<number> {
		return this.session.api.guilds(guildId).prune.post<number>({ body: options });
	}

	async getVoiceRegions(guildId: string) {
		return this.session.api.guilds(guildId).regions.get<APIVoiceRegion[]>();
	}

	async getInvites(guildId: string) {
		return this.session.api.guilds(guildId).invites.get<APIInvite[]>();
	}

	async getIntegrations(guildId: string) {
		return this.session.api.guilds(guildId).integrations().get<APIGuildIntegration[]>();
	}

	async deleteIntegration(guildId: string, integrationId: string) {
		return this.session.api.guilds(guildId).integrations(integrationId).delete();
	}

	async getWidget(guildId: string) {
		return this.session.api.guilds(guildId).widget.get<APIGuildWidget>();
	}

	async modifyWidget(guildId: string, options: ObjectToSnake<GuildWidgetModifyOptions>) {
		return this.session.api.guilds(guildId).widget.patch<APIGuildWidget>({ body: options });
	}

	async getVanityUrl(guildId: string) {
		return this.session.api.guilds(guildId)["vanity-url"].get<Partial<APIInvite>>();
	}

	async getWelcomeScreen(guildId: string) {
		return this.session.api.guilds(guildId)["welcome-screen"].get<APIGuildWelcomeScreen>();
	}

	async modifyWelcomeScreen(guildId: string, options: ObjectToSnake<GuildWelcomeScreenModifyOptions>) {
		return this.session.api.guilds(guildId)["welcome-screen"].patch<APIGuildWelcomeScreen>({ body: options });
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
	roles?: ObjectToSnake<GuildCreateOptionsRole>[];
	channels?: ObjectToSnake<GuildCreateOptionsChannel>;
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

/**
 * @link https://discord.com/developers/docs/resources/guild#begin-guild-prune
 */
export interface GuildPruneOptions {
	days: number;
	computePruneCount?: boolean;
	includeRoles?: string;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#modify-guild-widget
 */
export interface GuildWidgetModifyOptions {
	enabled?: boolean;
	channelId?: string;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#welcome-screen-object-welcome-screen-channel-structure
 */
export interface APIGuildWelcomeScreenChannel {
	channelId: string;
	description: string;
	emojiId?: string;
	emojiName?: string;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#modify-guild-welcome-screen
 */
export interface GuildWelcomeScreenModifyOptions {
	enabled?: boolean;
	welcomeChannels?: ObjectToSnake<APIGuildWelcomeScreenChannel>[];
	description?: string;
}

/**
 * @link https://discord.com/developers/docs/resources/guild#modify-user-voice-state
 */
export interface GuildUserVoiceStateModifyOptions {
	channelId?: string;
	suppress?: boolean;
}
