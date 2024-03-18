import type {
	APIGuildMember,
	APIInteractionDataResolvedGuildMember,
	APIUser,
	GatewayGuildMemberAddDispatchData,
	GatewayGuildMemberUpdateDispatchData,
	MakeRequired,
	MessageCreateBodyRequest,
	ObjectToLower,
	RESTGetAPIGuildMembersQuery,
	RESTGetAPIGuildMembersSearchQuery,
	RESTPatchAPIGuildMemberJSONBody,
	RESTPutAPIGuildBanJSONBody,
	RESTPutAPIGuildMemberJSONBody,
	ToClass,
} from '../common';
import { DiscordBase } from './extra/DiscordBase';

export type GuildMemberData =
	| APIGuildMember
	| GatewayGuildMemberUpdateDispatchData
	| GatewayGuildMemberAddDispatchData
	| APIInteractionDataResolvedGuildMember;

import type { BaseClient } from '../client/base';
import type { ImageOptions, MethodContext } from '../common/types/options';
import type { GuildMemberResolvable } from '../common/types/resolvables';
import { User } from './User';
import { PermissionsBitField } from './extra/Permissions';

export type GatewayGuildMemberAddDispatchDataFixed<Pending extends boolean> = Pending extends true
	? Omit<GatewayGuildMemberAddDispatchData, 'user'> & { id: string }
	: MakeRequired<GatewayGuildMemberAddDispatchData, 'user'>;

export interface BaseGuildMember extends DiscordBase, ObjectToLower<Omit<APIGuildMember, 'user' | 'roles'>> {}
export class BaseGuildMember extends DiscordBase {
	private _roles: string[];
	joinedTimestamp?: number;
	communicationDisabledUntilTimestamp?: number | null;
	constructor(
		client: BaseClient,
		data: GuildMemberData,
		id: string,
		/** the choosen guild id */
		readonly guildId: string,
	) {
		const { roles, ...dataN } = data;
		super(client, { ...dataN, id });
		this._roles = data.roles;
		this.patch(data);
	}

	guild(force = false) {
		return this.client.guilds.fetch(this.id, force);
	}

	fetch(force = false) {
		return this.client.members.fetch(this.guildId, this.id, force);
	}

	ban(body?: RESTPutAPIGuildBanJSONBody, reason?: string) {
		return this.client.members.ban(this.guildId, this.id, body, reason);
	}

	kick(reason?: string) {
		return this.client.members.kick(this.guildId, this.id, reason);
	}

	edit(body: RESTPatchAPIGuildMemberJSONBody, reason?: string) {
		return this.client.members.edit(this.guildId, this.id, body, reason);
	}

	presence() {
		return this.cache.presences?.get(this.id);
	}

	voice() {
		return this.cache.voiceStates?.get(this.id, this.guildId);
	}

	toString() {
		return `<@${this.id}>`;
	}

	private patch(data: GuildMemberData) {
		if ('joined_at' in data && data.joined_at) {
			this.joinedTimestamp = Date.parse(data.joined_at);
		}
		if ('communication_disabled_until' in data) {
			this.communicationDisabledUntilTimestamp = data.communication_disabled_until?.length
				? Date.parse(data.communication_disabled_until)
				: null;
		}
	}

	get roles() {
		return {
			values: Object.freeze(this._roles),
			add: (id: string) => this.client.members.addRole(this.guildId, this.id, id),
			remove: (id: string) => this.client.members.removeRole(this.guildId, this.id, id),
			permissions: async () =>
				new PermissionsBitField(
					((await this.cache.roles?.bulk(this.roles.values as string[])) ?? [])
						.filter(x => x)
						.map(x => BigInt(x!.permissions.bits)),
				),
		};
	}

	static methods({ client, guildId }: MethodContext<{ guildId: string }>) {
		return {
			resolve: (resolve: GuildMemberResolvable) => client.members.resolve(guildId, resolve),
			search: (query?: RESTGetAPIGuildMembersSearchQuery) => client.members.search(guildId, query),
			unban: (id: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) =>
				client.members.unban(guildId, id, body, reason),
			ban: (id: string, body?: RESTPutAPIGuildBanJSONBody, reason?: string) =>
				client.members.ban(guildId, id, body, reason),
			kick: (id: string, reason?: string) => client.members.kick(guildId, id, reason),
			edit: (id: string, body: RESTPatchAPIGuildMemberJSONBody, reason?: string) =>
				client.members.edit(guildId, id, body, reason),
			add: (id: string, body: RESTPutAPIGuildMemberJSONBody) => client.members.add(guildId, id, body),
			fetch: (memberId: string, force = false) => client.members.fetch(guildId, memberId, force),
			list: (query?: RESTGetAPIGuildMembersQuery, force = false) => client.members.list(guildId, query, force),
		};
	}
}

export interface GuildMember extends ObjectToLower<Omit<APIGuildMember, 'user' | 'roles'>> {}
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class GuildMember extends BaseGuildMember {
	user: User;
	constructor(
		client: BaseClient,
		data: GuildMemberData,
		user: APIUser | User,
		/** the choosen guild id */
		readonly guildId: string,
	) {
		super(client, data, user.id, guildId);
		this.user = user instanceof User ? user : new User(client, user);
	}

	get tag() {
		return this.user.tag;
	}

	get bot() {
		return this.user.bot;
	}

	get name() {
		return this.user.name;
	}

	get username() {
		return this.user.username;
	}

	get globalName() {
		return this.user.globalName;
	}

	/** gets the nickname or the username */
	get displayName() {
		return this.nick ?? this.globalName ?? this.username;
	}

	dm(force = false) {
		return this.user.dm(force);
	}

	write(body: MessageCreateBodyRequest) {
		return this.user.write(body);
	}

	avatarURL(options?: ImageOptions) {
		return this.user.avatarURL(options);
	}

	dynamicAvatarURL(options?: ImageOptions) {
		if (!this.avatar) {
			return this.user.avatarURL(options);
		}

		return this.rest.cdn.guildMemberAvatar(this.guildId, this.id, this.avatar, options);
	}

	async fetchPermissions() {
		if ('permissions' in this) return this.permissions as PermissionsBitField;
		return this.roles.permissions();
	}
}

export interface UnavailableMember {
	pending: true;
}

export class UnavailableMember extends BaseGuildMember {}

export interface InteractionGuildMember
	extends ObjectToLower<Omit<APIInteractionDataResolvedGuildMember, 'roles' | 'deaf' | 'mute' | 'permissions'>> {}
/**
 * Represents a guild member
 * @link https://discord.com/developers/docs/resources/guild#guild-member-object
 */
export class InteractionGuildMember extends (GuildMember as unknown as ToClass<
	Omit<GuildMember, 'deaf' | 'mute'>,
	InteractionGuildMember
>) {
	permissions: PermissionsBitField;
	constructor(
		client: BaseClient,
		data: APIInteractionDataResolvedGuildMember,
		user: APIUser | User,
		/** the choosen guild id */
		guildId: string,
	) {
		super(client, data, user, guildId);
		this.permissions = new PermissionsBitField(Number(data.permissions));
	}
}
