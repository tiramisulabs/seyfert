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

import type { UsingClient } from '../commands';
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
		client: UsingClient,
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
			keys: Object.freeze(this._roles.concat(this.guildId)) as string[],
			list: (force = false) =>
				this.client.roles
					.list(this.guildId, force)
					.then(roles => roles.filter(role => this.roles.keys.includes(role.id))),
			add: (id: string) => this.client.members.addRole(this.guildId, this.id, id),
			remove: (id: string) => this.client.members.removeRole(this.guildId, this.id, id),
			permissions: (force = false) =>
				this.roles.list(force).then(roles => new PermissionsBitField(roles.map(x => BigInt(x.permissions.bits)))),
			sorted: (force = false) => this.roles.list(force).then(roles => roles.sort((a, b) => b.position - a.position)),
			highest: (force = false) => this.roles.sorted(force).then(roles => roles[0]),
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
	private __me?: GuildMember;
	constructor(
		client: UsingClient,
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

	bannerURL(options?: ImageOptions) {
		return this.user.bannerURL(options);
	}

	async fetchPermissions(force = false) {
		if ('permissions' in this) return this.permissions as PermissionsBitField;
		return this.roles.permissions(force);
	}

	async manageable(force = false) {
		this.__me = await this.client.guilds.fetchSelf(this.guildId, force);
		const ownerId = (await this.client.guilds.fetch(this.guildId, force)).ownerId;
		if (this.user.id === ownerId) return false;
		if (this.user.id === this.client.botId) return false;
		if (this.client.botId === ownerId) return true;
		return (await this.__me!.roles.highest()).position > (await this.roles.highest(force)).position;
	}

	async bannable(force = false) {
		return (await this.manageable(force)) && (await this.__me!.fetchPermissions(force)).has('BanMembers');
	}

	async kickable(force = false) {
		return (await this.manageable(force)) && (await this.__me!.fetchPermissions(force)).has('KickMembers');
	}

	async moderatable(force = false) {
		return (
			!(await this.roles.permissions(force)).has('Administrator') &&
			(await this.manageable(force)) &&
			(await this.__me!.fetchPermissions(force)).has('KickMembers')
		);
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
		client: UsingClient,
		data: APIInteractionDataResolvedGuildMember,
		user: APIUser | User,
		/** the choosen guild id */
		guildId: string,
	) {
		super(client, data, user, guildId);
		this.permissions = new PermissionsBitField(Number(data.permissions));
	}
}
