import type { Session } from "../../session";
import type {
	APIGuild,
	ChannelType,
	APIBan,
	GuildMFALevel,
	APIRole,
	APIVoiceRegion,
	APIInvite,
	APIGuildIntegration,
	APIGuildWidget,
	APIGuildWelcomeScreen,
	APIGuildChannel,
	APIGuildWidgetSettings,
	GuildChannelType,
	RESTPostAPIGuildPruneJSONBody,
	RESTPostAPIGuildPruneResult,
	RESTPostAPIGuildsJSONBody,
	RESTPatchAPIGuildJSONBody,
	RESTPostAPIGuildChannelJSONBody,
	RESTPatchAPIGuildChannelPositionsJSONBody,
	RESTGetAPIChannelThreadsArchivedQuery,
	RESTGetAPIChannelUsersThreadsArchivedResult,
	RESTGetAPIGuildBansQuery,
	RESTPutAPIGuildBanJSONBody,
	RESTPostAPIGuildRoleJSONBody,
	RESTPatchAPIGuildRolePositionsJSONBody,
	RESTPatchAPIGuildRoleJSONBody,
	RESTPatchAPIGuildWidgetSettingsJSONBody,
	RESTGetAPIGuildVanityUrlResult,
	RESTPatchAPIGuildWelcomeScreenJSONBody,
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

	async create(options: RESTPostAPIGuildsJSONBody) {
		return this.session.api.guilds().post<APIGuild>({ body: options });
	}

	async delete(guildId: string) {
		return this.session.api.guilds(guildId).delete();
	}

	async edit(guildId: string, options: RESTPatchAPIGuildJSONBody) {
		return this.session.api.guilds(guildId).patch<APIGuild>({ body: options });
	}

	async getChannels(guildId: string) {
		return this.session.api.guilds(guildId).channels.get<APIGuildChannel<GuildChannelType>[]>();
	}

	async createChannel(guildId: string, options: RESTPostAPIGuildChannelJSONBody) {
		return this.session.api.guilds(guildId).channels.post<APIGuildChannel<GuildChannelType>[]>({ body: options });
	}

	async editChannelPositions(guildId: string, options: RESTPatchAPIGuildChannelPositionsJSONBody): Promise<void> {
		return this.session.api.guilds(guildId).channels.patch({ body: options });
	}

	async getThreads(guildId: string) {
		return this.session.api
			.guilds(guildId)
			.threads()
			.active.get<APIGuildChannel<ChannelType.PublicThread | ChannelType.PrivateThread>>();
	}

	async getArchivedThreads(
		guildId: string,
		options: RESTGetAPIChannelThreadsArchivedOptions,
	): Promise<RESTGetAPIChannelUsersThreadsArchivedResult> {
		const { type, ...query } = options;
		if (type === "private") {
			return this.session.api
				.guilds(guildId)
				.threads()
				.archived.private.get({ query: objectToParams(query) });
		}

		return this.session.api
			.guilds(guildId)
			.threads()
			.archived.public.get({ query: objectToParams(query) });
	}

	async getBans(guildId: string, query: RESTGetAPIGuildBansQuery = {}) {
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

	async createBan(guildId: string, userId: string, options: RESTPutAPIGuildBanJSONBody) {
		return this.session.api.guilds(guildId).bans(userId).put({ body: options });
	}

	async removeBan(guildId: string, userId: string) {
		return this.session.api.guilds(guildId).bans(userId).delete();
	}

	async getRoles(guildId: string) {
		return this.session.api.guilds(guildId).roles().get<APIRole[]>();
	}

	async createRole(guildId: string, options: RESTPostAPIGuildRoleJSONBody) {
		return this.session.api.guilds(guildId).roles().post<APIRole>({ body: options });
	}

	async editRolePositions(guildId: string, options: RESTPatchAPIGuildRolePositionsJSONBody[]) {
		return this.session.api.guilds(guildId).roles().patch<APIRole[]>({ body: options });
	}

	async editRole(guildId: string, roleId: string, options: RESTPatchAPIGuildRoleJSONBody) {
		return this.session.api.guilds(guildId).roles(roleId).patch<APIRole>({ body: options });
	}

	async deleteRole(guildId: string, roleId: string) {
		return this.session.api.guilds(guildId).roles(roleId).delete();
	}

	async modifyGuildMFALevel(guildId: string, level: GuildMFALevel) {
		return this.session.api.guilds(guildId).mfa(level).post<void>();
	}

	async getPruneCount(guildId: string, options: RESTPostAPIGuildPruneJSONBody) {
		return this.session.api.guilds(guildId).prune.get<RESTPostAPIGuildPruneResult>({ query: objectToParams(options) });
	}

	async beginGuildPrune(guildId: string, options: RESTPostAPIGuildPruneJSONBody) {
		return this.session.api.guilds(guildId).prune.post<RESTPostAPIGuildPruneResult>({ body: options });
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

	async modifyWidget(guildId: string, options: RESTPatchAPIGuildWidgetSettingsJSONBody) {
		return this.session.api.guilds(guildId).widget.patch<APIGuildWidgetSettings>({ body: options });
	}

	async getVanityUrl(guildId: string) {
		return this.session.api.guilds(guildId)["vanity-url"].get<RESTGetAPIGuildVanityUrlResult>();
	}

	async getWelcomeScreen(guildId: string) {
		return this.session.api.guilds(guildId)["welcome-screen"].get<APIGuildWelcomeScreen>();
	}

	async modifyWelcomeScreen(guildId: string, options: RESTPatchAPIGuildWelcomeScreenJSONBody) {
		return this.session.api.guilds(guildId)["welcome-screen"].patch<APIGuildWelcomeScreen>({ body: options });
	}
}

export type RESTGetAPIChannelThreadsArchivedOptions = ({ type: "private" } | { type: "public" }) &
	RESTGetAPIChannelThreadsArchivedQuery;
