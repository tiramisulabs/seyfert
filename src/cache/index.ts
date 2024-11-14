import { type If, Logger } from '../common';

import type { Adapter } from './adapters';

import { Guilds } from './resources/guilds';
import { Users } from './resources/users';

import { Bans } from './resources/bans';
import { Channels } from './resources/channels';
import { Emojis } from './resources/emojis';
import { Members } from './resources/members';
import { Presences } from './resources/presence';
import { Roles } from './resources/roles';
import { StageInstances } from './resources/stage-instances';
import { Stickers } from './resources/stickers';
import { VoiceStates } from './resources/voice-states';

import type { InternalOptions, UsingClient } from '../commands';
import {
	type APIChannel,
	type APIEmoji,
	type APIGuildMember,
	type APIOverwrite,
	type APISticker,
	type APITextChannel,
	type APIUser,
	ChannelType,
	type GatewayDispatchPayload,
	GatewayIntentBits,
	GuildMemberFlags,
	OverwriteType,
} from '../types';
import { Messages } from './resources/messages';
import { Overwrites } from './resources/overwrites';
export { BaseResource } from './resources/default/base';
export { GuildRelatedResource } from './resources/default/guild-related';
export { GuildBasedResource } from './resources/default/guild-based';

export type InferAsyncCache = InternalOptions extends { asyncCache: infer P } ? P : false;
export type ReturnCache<T> = If<InferAsyncCache, Promise<T>, T>;

// GuildBased
export type GuildBased = 'members' | 'voiceStates';

// ClientGuildBased
export type GuildRelated =
	| 'emojis'
	| 'roles'
	| 'channels'
	| 'stickers'
	| 'presences'
	| 'stageInstances'
	| 'overwrites'
	| 'messages'
	| 'bans';

// ClientBased
export type NonGuildBased = 'users' | 'guilds';

// ClientBased
export type SeyfertBased = 'onPacket';

type ReturnManagers = {
	[K in NonGuildBased | GuildBased | GuildRelated]: NonNullable<Awaited<ReturnType<NonNullable<Cache[K]>['get']>>>;
};

export * from './adapters/index';

export type CachedEvents =
	| 'READY'
	| 'GUILD_CREATE'
	| 'GUILD_UPDATE'
	| 'GUILD_DELETE'
	| 'CHANNEL_CREATE'
	| 'CHANNEL_UPDATE'
	| 'CHANNEL_DELETE'
	| 'GUILD_ROLE_CREATE'
	| 'GUILD_ROLE_UPDATE'
	| 'GUILD_ROLE_DELETE'
	| 'GUILD_BAN_ADD'
	| 'GUILD_BAN_REMOVE'
	| 'GUILD_EMOJIS_UPDATE'
	| 'GUILD_STICKERS_UPDATE'
	| 'GUILD_MEMBER_ADD'
	| 'GUILD_MEMBER_UPDATE'
	| 'GUILD_MEMBER_REMOVE'
	| 'MESSAGE_CREATE'
	| 'PRESENCE_UPDATE'
	| 'THREAD_DELETE'
	| 'THREAD_CREATE'
	| 'THREAD_UPDATE'
	| 'USER_UPDATE'
	| 'VOICE_STATE_UPDATE'
	| 'STAGE_INSTANCE_CREATE'
	| 'STAGE_INSTANCE_UPDATE'
	| 'STAGE_INSTANCE_DELETE';

export type DisabledCache = {
	[P in NonGuildBased | GuildBased | GuildRelated | SeyfertBased]?: boolean;
};

export class Cache {
	// non-guild based
	users?: Users;
	guilds?: Guilds;

	// guild based
	members?: Members;
	voiceStates?: VoiceStates;

	// guild related
	overwrites?: Overwrites;
	roles?: Roles;
	emojis?: Emojis;
	channels?: Channels;
	stickers?: Stickers;
	presences?: Presences;
	stageInstances?: StageInstances;
	messages?: Messages;
	bans?: Bans;

	__logger__?: Logger;

	constructor(
		public intents: number,
		public adapter: Adapter,
		disabledCache: DisabledCache,
		client: UsingClient,
	) {
		this.buildCache(disabledCache, client);
	}

	buildCache(disabledCache: DisabledCache, client: UsingClient) {
		// non-guild based
		this.users = disabledCache.users ? undefined : new Users(this, client);
		this.guilds = disabledCache.guilds ? undefined : new Guilds(this, client);

		// guild related
		this.members = disabledCache.members ? undefined : new Members(this, client);
		this.voiceStates = disabledCache.voiceStates ? undefined : new VoiceStates(this, client);

		// guild based
		this.roles = disabledCache.roles ? undefined : new Roles(this, client);
		this.overwrites = disabledCache.overwrites ? undefined : new Overwrites(this, client);
		this.channels = disabledCache.channels ? undefined : new Channels(this, client);
		this.emojis = disabledCache.emojis ? undefined : new Emojis(this, client);
		this.stickers = disabledCache.stickers ? undefined : new Stickers(this, client);
		this.presences = disabledCache.presences ? undefined : new Presences(this, client);
		this.stageInstances = disabledCache.stageInstances ? undefined : new StageInstances(this, client);
		this.messages = disabledCache.messages ? undefined : new Messages(this, client);
		this.bans = disabledCache.bans ? undefined : new Bans(this, client);

		this.onPacket = disabledCache.onPacket
			? ((() => {
					//
				}) as any as () => Promise<void>)
			: this.onPacketDefault.bind(this);
	}

	flush(): ReturnCache<void> {
		return this.adapter.flush() as void;
	}

	// internal use ./structures
	hasIntent(intent: keyof typeof GatewayIntentBits) {
		return (this.intents & GatewayIntentBits[intent]) === GatewayIntentBits[intent];
	}

	get hasGuildsIntent() {
		return this.hasIntent('Guilds');
	}

	get hasRolesIntent() {
		return this.hasGuildsIntent;
	}

	get hasChannelsIntent() {
		return this.hasGuildsIntent;
	}

	get hasGuildMembersIntent() {
		return this.hasIntent('GuildMembers');
	}

	get hasGuildExpressionsIntent() {
		return this.hasIntent('GuildExpressions');
	}

	get hasVoiceStatesIntent() {
		return this.hasIntent('GuildVoiceStates');
	}

	get hasPrenseceUpdates() {
		return this.hasIntent('GuildPresences');
	}

	get hasDirectMessages() {
		return this.hasIntent('DirectMessages');
	}

	get hasBansIntent() {
		return this.hasIntent('GuildBans');
	}

	async bulkGet(
		keys: (
			| readonly [
					/* type */
					NonGuildBased | GuildRelated,
					/* source id */
					string,
			  ]
			| readonly [
					/* type */
					GuildBased,
					/* source id */
					string,
					/* guild id */
					string,
			  ]
		)[],
	) {
		const allData: Partial<Record<NonGuildBased | GuildBased | GuildRelated, string[][]>> = {};
		for (const [type, id, guildId] of keys) {
			switch (type) {
				case 'voiceStates':
				case 'members':
					{
						if (!allData[type]) {
							allData[type] = [];
						}
						allData[type]!.push([id, guildId]);
					}
					break;
				case 'roles':
				case 'stickers':
				case 'channels':
				case 'presences':
				case 'stageInstances':
				case 'emojis':
				case 'users':
				case 'guilds':
				case 'overwrites':
				case 'bans':
				case 'messages':
					{
						if (!allData[type]) {
							allData[type] = [];
						}
						allData[type]!.push([id]);
					}
					break;
				default:
					throw new Error(`Invalid type ${type}`);
			}
		}

		const obj: Partial<{
			[K in keyof ReturnManagers]: ReturnManagers[K][];
		}> = {};

		for (const i in allData) {
			const key = i as NonGuildBased | GuildBased | GuildRelated;
			const values = allData[key]!;
			obj[key] = [];
			for (const value of values) {
				const g = await this[key]?.get(value[0], value[1]);
				if (!g) {
					continue;
				}
				obj[key]!.push(g as never);
			}
		}

		return obj;
	}

	async bulkPatch(
		keys: (
			| readonly [
					/* type */
					NonGuildBased,
					/* data */
					any,
					/* source id */
					string,
			  ]
			| readonly [
					/* type */
					GuildBased | GuildRelated,
					/* data */
					any,
					/* source id */
					string,
					/* guild id */
					string,
			  ]
		)[],
	) {
		const allData: [string, any][] = [];
		const relationshipsData: Record<string, string[]> = {};
		for (const [type, data, id, guildId] of keys) {
			switch (type) {
				case 'roles':
				case 'stickers':
				case 'channels':
				case 'presences':
				case 'stageInstances':
				case 'emojis':
				case 'overwrites':
				case 'bans':
				case 'messages':
					{
						if (!this[type]?.filter(data, id, guildId)) continue;
						const hashId = this[type]?.hashId(guildId!);
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						if (type !== 'overwrites') {
							data.guild_id = guildId;
						}
						allData.push([this[type]!.hashId(id), this[type]!.parse(data, id, guildId!)]);
					}
					break;
				case 'voiceStates':
				case 'members':
					{
						if (!this[type]?.filter(data, id, guildId)) continue;
						const hashId = this[type]?.hashId(guildId!);
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						data.guild_id = guildId;
						allData.push([this[type]!.hashGuildId(guildId, id), this[type]!.parse(data, id, guildId!)]);
					}
					break;
				case 'users':
				case 'guilds':
					{
						if (!this[type]?.filter(data, id)) continue;
						const hashId = this[type]?.namespace;
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						allData.push([this[type]!.hashId(id), data]);
					}
					break;
				default:
					throw new Error(`Invalid type ${type}`);
			}
		}

		await this.adapter.bulkAddToRelationShip(relationshipsData);
		await this.adapter.bulkPatch(false, allData);
	}

	async bulkSet(
		keys: (
			| readonly [
					/* type */
					NonGuildBased,
					/* data */
					any,
					/* source id */
					string,
			  ]
			| readonly [
					/* type */
					GuildBased | GuildRelated,
					/* data */
					any,
					/* source id */
					string,
					/* guild id */
					string,
			  ]
		)[],
	) {
		const allData: [string, any][] = [];
		const relationshipsData: Record<string, string[]> = {};
		for (const [type, data, id, guildId] of keys) {
			switch (type) {
				case 'roles':
				case 'stickers':
				case 'channels':
				case 'presences':
				case 'stageInstances':
				case 'emojis':
				case 'overwrites':
				case 'messages':
					{
						if (!this[type]?.filter(data, id, guildId)) continue;
						const hashId = this[type]?.hashId(guildId!);
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						if (type !== 'overwrites') {
							data.guild_id = guildId;
						}
						allData.push([this[type]!.hashId(id), this[type]!.parse(data, id, guildId!)]);
					}
					break;
				case 'bans':
				case 'voiceStates':
				case 'members':
					{
						if (!this[type]?.filter(data, id, guildId)) continue;
						const hashId = this[type]?.hashId(guildId!);
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						data.guild_id = guildId;
						allData.push([this[type]!.hashGuildId(guildId, id), this[type]!.parse(data, id, guildId!)]);
					}
					break;
				case 'users':
				case 'guilds':
					{
						if (!this[type]?.filter(data, id)) continue;
						const hashId = this[type]?.namespace;
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						allData.push([this[type]!.hashId(id), data]);
					}
					break;
				default:
					throw new Error(`Invalid type ${type}`);
			}
		}

		await this.adapter.bulkAddToRelationShip(relationshipsData);
		await this.adapter.bulkSet(allData);
	}

	onPacket(event: GatewayDispatchPayload) {
		return this.onPacketDefault(event);
	}

	protected async onPacketDefault(event: GatewayDispatchPayload) {
		switch (event.t) {
			case 'READY':
				await this.users?.set(event.d.user.id, event.d.user);
				break;
			case 'GUILD_CREATE':
			case 'GUILD_UPDATE':
				await this.guilds?.patch(event.d.id, { unavailable: false, ...event.d });
				break;
			case 'GUILD_DELETE':
				if (event.d.unavailable) {
					await this.guilds?.patch(event.d.id, event.d);
				} else {
					await this.guilds?.remove(event.d.id);
				}
				break;
			case 'CHANNEL_CREATE':
			case 'CHANNEL_UPDATE':
				{
					if ('guild_id' in event.d) {
						await this.channels?.set(event.d.id, event.d.guild_id!, event.d);
						if (event.d.permission_overwrites?.length)
							await this.overwrites?.set(event.d.id, event.d.guild_id!, event.d.permission_overwrites);
						break;
					}
					if (event.d.type === ChannelType.DM) {
						await this.channels?.set(event.d.recipients![0]?.id, '@me', event.d);
						break;
					}
				}
				break;
			case 'CHANNEL_DELETE':
				await this.channels?.remove(event.d.id, 'guild_id' in event.d ? event.d.guild_id! : '@me');
				break;
			case 'GUILD_ROLE_CREATE':
			case 'GUILD_ROLE_UPDATE':
				await this.roles?.set(event.d.role.id, event.d.guild_id, event.d.role);
				break;
			case 'GUILD_ROLE_DELETE':
				await this.roles?.remove(event.d.role_id, event.d.guild_id);
				break;
			case 'GUILD_BAN_ADD':
				await this.bans?.set(event.d.user.id, event.d.guild_id, event.d);
				break;
			case 'GUILD_BAN_REMOVE':
				await this.bans?.remove(event.d.user.id, event.d.guild_id);
				break;
			case 'GUILD_EMOJIS_UPDATE':
				{
					await this.emojis?.remove(await this.emojis?.keys(event.d.guild_id), event.d.guild_id);
					await this.emojis?.set(
						event.d.emojis.map(x => [x.id!, x] as [string, APIEmoji]),
						event.d.guild_id,
					);
				}
				break;
			case 'GUILD_STICKERS_UPDATE':
				{
					await this.stickers?.remove(await this.stickers?.keys(event.d.guild_id), event.d.guild_id);
					await this.stickers?.set(
						event.d.stickers.map(x => [x.id, x] as [string, APISticker]),
						event.d.guild_id,
					);
				}
				break;
			case 'GUILD_MEMBER_ADD':
			case 'GUILD_MEMBER_UPDATE':
				if (event.d.user) await this.members?.set(event.d.user.id, event.d.guild_id, event.d);
				break;
			case 'GUILD_MEMBER_REMOVE':
				await this.members?.remove(event.d.user.id, event.d.guild_id);
				break;

			case 'PRESENCE_UPDATE':
				// Should update member data?
				await this.presences?.set(event.d.user.id, event.d.guild_id, event.d);
				break;

			case 'THREAD_CREATE':
			case 'THREAD_UPDATE':
				if (event.d.guild_id) await this.channels?.set(event.d.id, event.d.guild_id, event.d);
				break;

			case 'THREAD_DELETE':
				await this.channels?.remove(event.d.id, event.d.guild_id);
				break;

			case 'USER_UPDATE':
				await this.users?.set(event.d.id, event.d);
				break;

			case 'VOICE_STATE_UPDATE':
				{
					if (!event.d.guild_id) {
						return;
					}

					if (event.d.channel_id != null) {
						await this.voiceStates?.set(event.d.user_id, event.d.guild_id, event.d);
					} else {
						await this.voiceStates?.remove(event.d.user_id, event.d.guild_id);
					}
				}
				break;
			case 'STAGE_INSTANCE_CREATE':
			case 'STAGE_INSTANCE_UPDATE':
				await this.stageInstances?.set(event.d.id, event.d.guild_id, event.d);
				break;
			case 'STAGE_INSTANCE_DELETE':
				await this.stageInstances?.remove(event.d.id, event.d.guild_id);
				break;
			case 'MESSAGE_CREATE':
				await this.messages?.set(event.d.id, event.d.channel_id, event.d);
				break;
			case 'MESSAGE_UPDATE':
				await this.messages?.patch(event.d.id, event.d.channel_id, event.d);
				break;
			case 'MESSAGE_DELETE':
				await this.messages?.remove(event.d.id, event.d.channel_id);
				break;
			case 'MESSAGE_DELETE_BULK':
				await this.messages?.remove(event.d.ids, event.d.channel_id);
				break;
		}
	}

	async testAdapter() {
		this.__logger__ ??= new Logger({
			name: '[CACHE]',
		});
		await this.adapter.flush();
		// this method will only check the cache for `users`, `members` y `channels`
		// likewise these have the three types of resources (GuildRelatedResource, GuildBasedResource, BaseResource)
		// will also check `overwrites`, since the latter stores an array not as an object but as data.

		await this.testUsersAndMembers();
		await this.testChannelsAndOverwrites();

		this.__logger__.info('The adapter seems to work properly');
		this.__logger__.debug('Flushing adapter');

		delete this.__logger__;

		await this.adapter.flush();
	}

	private async testUsersAndMembers() {
		if (!this.users) throw new Error('Users cache disabled, you should enable it for this.');
		if (!this.members) throw new Error('Members cache disabled, you should enable it for this.');

		function createUser(name: string): APIUser {
			return {
				avatar: 'xdxd',
				discriminator: '0',
				global_name: name,
				id: `${Math.random()}`.slice(2),
				username: `@seyfert/${name}`,
			};
		}
		function createMember(name: string): APIGuildMember {
			return {
				banner: null,
				avatar: 'xdxd',
				deaf: !false,
				flags: GuildMemberFlags.StartedHomeActions,
				joined_at: new Date().toISOString(),
				mute: !true,
				roles: ['111111111111'],
				user: createUser(name),
			};
		}
		const users: APIUser[] = [
			createUser('witherking_'),
			createUser('vanecia'),
			createUser('socram'),
			createUser('free'),
			createUser('justevil'),
			createUser('nobody'),
			createUser('aaron'),
			createUser('simxnet'),
			createUser('yuzu'),
			createUser('vyrek'),
			createUser('marcrock'),
		];
		for (const user of users) {
			await this.users.set(user.id, user);
		}
		let count = 0;
		if ((await this.users.values()).length !== users.length)
			throw new Error('users.values() is not of the expected size.');
		if ((await this.users.count()) !== users.length) throw new Error('users.count() is not of the expected amount');
		for (const user of users) {
			const cache = await this.users.raw(user.id);
			if (!cache) throw new Error(`users.raw(${user.id}) has returned undefined!!!!!!`);
			if (cache.username !== user.username)
				throw new Error(
					`users.raw(${user.id}).username is not of the expected value!!!!! (cache (${cache.username})) (expected value: (${user.username}))`,
				);
			if (cache.id !== user.id)
				throw new Error(
					`users.raw(${user.id}).id is not of the expected value!!!!!! (cache (${cache.id})) (expected value: (${user.id}))`,
				);
			await this.users.remove(user.id);
			if ((await this.users.count()) !== users.length - ++count)
				throw new Error(`users.count() should be ${users.length - count}!! please check your remove method`);
		}

		this.__logger__!.info('the user cache seems to be alright.');
		this.__logger__!.debug('Flushing adapter to clear users cache.');

		await this.adapter.flush();

		// unexpected error message
		if ((await this.users.count()) !== 0) throw new Error('users.count() should be 0!! please check your flush method');

		const guildMembers: Record<string, APIGuildMember[]> = {
			'852531635252494346': [
				createMember("witherking_'s member"),
				createMember("vanecia's member"),
				createMember("nobody's member"),
			],
			'1003825077969764412': [
				createMember("free's member"),
				createMember("socram's member"),
				createMember("marcrock's member"),
				createMember("justevil's member"),
				createMember("vyrek's member"),
			],
			'876711213126520882': [
				createMember("aaron's member"),
				createMember("simxnet's member"),
				createMember("yuzu's member"),
			],
		};

		for (const guildId in guildMembers) {
			const members = guildMembers[guildId];
			for (const member of members) {
				await this.members.set(member.user.id, guildId, member);
			}
			if ((await this.members.values(guildId)).length !== members.length)
				throw new Error('members.values(guildId) is not of the expected size.');
			if ((await this.members.count(guildId)) !== members.length)
				throw new Error('members.count(guildId) is not of the expected amount');
			for (const member of members) {
				const cache = await this.members.raw(member.user.id, guildId);
				if (!cache) throw new Error(`members.raw(${member.user.id}, ${guildId}) has returned undefined.`);
				if (cache.roles[0] !== member.roles[0])
					throw new Error(
						`members.raw(${member.user.id}, ${guildId}).roles[0] is not the expected value: ${member.roles[0]} (cache: ${cache.roles[0]})`,
					);
				if (cache.user.username !== member.user.username)
					throw new Error(
						`members.raw(${member.user.id}, ${guildId}).user.username is not the expected value!!!!!! (cache (${cache.user.username})) (expected value: (${member.user.username}))`,
					);
				if (cache.user.id !== member.user.id)
					throw new Error(
						`members.raw(${member.user.id}, ${guildId}).user.id is not the expected value!!!!!! (cache (${cache.user.id})) (expected value: (${member.user.id}))`,
					);
			}
		}
		if ((await this.members.values('*')).length !== Object.values(guildMembers).flat().length)
			throw new Error('members.values(*) is not of the expected size');
		if ((await this.members.count('*')) !== Object.values(guildMembers).flat().length)
			throw new Error('the global amount of members.count(*) is not the expected amount');

		count = 0;
		for (const guildId in guildMembers) {
			const members = guildMembers[guildId];
			for (const member of members) {
				await this.members.remove(member.user.id, guildId);
				if ((await this.members.count(guildId)) !== members.length - ++count)
					throw new Error(
						`members.count(${guildId}) should be ${members.length - count}!! please check your remove method`,
					);
			}
			count = 0;
		}

		await this.adapter.flush();

		// unexpected error message
		if ((await this.users.count()) !== 0)
			throw new Error('users.count() should be zero!! please check your flush method');
		// unexpected error message
		if ((await this.members.count('*')) !== 0)
			throw new Error("members.count('*') should be zero!! please check your flush method");

		this.__logger__!.info('the member cache seems to be alright.');
	}

	private async testChannelsAndOverwrites() {
		if (!this.channels) throw new Error('Channels cache disabled, you should enable it for this.');
		if (!this.overwrites) throw new Error('Overwrites cache disabled, you should enable it for this.');

		function createChannel(name: string): APITextChannel {
			return {
				id: `${Math.random()}`.slice(2),
				name,
				type: ChannelType.GuildText,
				position: Math.random() > 0.5 ? 1 : 0,
			};
		}

		function createOverwrites(name: string): (APIOverwrite & { channel_id: string })[] {
			const channel_id = `${Math.random()}`.slice(2);
			return [
				{
					id: name,
					allow: '8',
					deny: '2',
					type: OverwriteType.Role,
					channel_id,
				},
				{
					id: `${name}-2`,
					allow: '8',
					deny: '2',
					type: OverwriteType.Role,
					channel_id,
				},
			];
		}

		const guildChannels: Record<string, APIChannel[]> = {
			'852531635252494346': [
				createChannel("witherking_'s channel"),
				createChannel("vanecia's channel"),
				createChannel("nobody's channel"),
			],
			'1003825077969764412': [
				createChannel("free's channel"),
				createChannel("socram's channel"),
				createChannel("marcrock's channel"),
				createChannel("justevil's channel"),
				createChannel("vyrek's channel"),
			],
			'876711213126520882': [
				createChannel("aaron's channel"),
				createChannel("simxnet's channel"),
				createChannel("yuzu's channel"),
			],
		};

		for (const guildId in guildChannels) {
			const channels = guildChannels[guildId];
			for (const channel of channels) {
				await this.channels.set(channel.id, guildId, channel);
			}
			if ((await this.channels.values(guildId)).length !== channels.length)
				throw new Error('channels.values(guildId) is not of the expected size');
			if ((await this.channels.count(guildId)) !== channels.length)
				throw new Error('channels.count(guildId) is not of the expected amount');
			for (const channel of channels) {
				const cache = await this.channels.raw(channel.id);
				if (!cache) throw new Error(`channels.raw(${channel.id}) has returned undefined!!!!!!`);
				if (cache.type !== ChannelType.GuildText)
					throw new Error(
						`channels.raw(${channel.id}).type is not of the expected type: ${channel.type}!!!!!!!! (mismatched type: ${cache.type})`,
					);
				if (cache.name !== channel.name)
					throw new Error(
						`channels.raw(${channel.id}).name is not the expected value!!!!!! (cache (${cache.name})) (expected value: (${channel.name}))`,
					);
				if (cache.id !== channel.id)
					throw new Error(
						`channels.raw(${channel.id}).id is not the expected value!!!!!! (cache (${cache.id})) (expected value: (${channel.id}))`,
					);
			}
		}
		if ((await this.channels.values('*')).length !== Object.values(guildChannels).flat().length)
			throw new Error('channels.values(*) is not of the expected size');
		if ((await this.channels.count('*')) !== Object.values(guildChannels).flat().length)
			throw new Error('channels.count(*) is not of the expected amount');

		let count = 0;
		for (const guildId in guildChannels) {
			const channels = guildChannels[guildId];
			for (const channel of channels) {
				await this.channels.remove(channel.id, guildId);
				if ((await this.channels.count(guildId)) !== channels.length - ++count)
					throw new Error(
						`channels.count(${guildId}) should be ${channels.length - count}!! please check your remove method`,
					);
			}
			count = 0;
		}

		// unexpected error message
		if ((await this.channels.count('*')) !== 0)
			throw new Error(`channels.count('*') should be zero!! please check your remove method`);

		this.__logger__!.info('the channel cache seems to be alright');

		const guildOverwrites: Record<string, ReturnType<typeof createOverwrites>[]> = {
			'852531635252494346': [
				createOverwrites("witherking_'s channel"),
				createOverwrites("vanecia's channel"),
				createOverwrites("nobody's channel"),
			],
			'1003825077969764412': [
				createOverwrites("free's channel"),
				createOverwrites("socram's channel"),
				createOverwrites("marcrock's channel"),
				createOverwrites("justevil's channel"),
				createOverwrites("vyrek's channel"),
			],
			'876711213126520882': [
				createOverwrites("aaron's channel"),
				createOverwrites("simxnet's channel"),
				createOverwrites("yuzu's channel"),
			],
		};
		for (const guildId in guildOverwrites) {
			const bulkOverwrites = guildOverwrites[guildId];
			for (const overwrites of bulkOverwrites) {
				await this.overwrites.set(overwrites[0].channel_id, guildId, overwrites);
			}
			if ((await this.overwrites.values(guildId)).length !== bulkOverwrites.length)
				throw new Error('overwrites.values(channelId) is not of the expected size');
			if ((await this.overwrites.count(guildId)) !== bulkOverwrites.length)
				throw new Error('overwrites.count(channelId) is not of the expected amount');
			for (const overwrites of bulkOverwrites) {
				const cache = await this.overwrites.raw(overwrites[0].channel_id);
				if (!cache) throw new Error(`overwrites.raw(${overwrites[0].channel_id}) has returned undefined!!!!!!`);
				if (cache.length !== overwrites.length)
					throw new Error(
						`overwrites.raw(${overwrites[0].channel_id}).length is not of the expected length!!!!!! (cache (${cache.length})) (expected value: (${overwrites.length}))`,
					);
				for (const overwrite of overwrites) {
					if (
						!cache.some(x => {
							return (
								x.allow === overwrite.allow &&
								x.deny === overwrite.deny &&
								x.guild_id === guildId &&
								x.id === overwrite.id &&
								x.type === overwrite.type
							);
						})
					)
						throw new Error("cache wasn't found in the overwrites cache");
				}
			}
		}

		count = 0;

		for (const guildId in guildOverwrites) {
			const bulkOverwrites = guildOverwrites[guildId];
			for (const overwrites of bulkOverwrites) {
				await this.overwrites.remove(overwrites[0].channel_id, guildId);
				if ((await this.overwrites.count(guildId)) !== bulkOverwrites.length - ++count)
					throw new Error(
						`overwrites.count(${guildId}) should be ${overwrites.length - count}!! please check your remove method`,
					);
			}
			count = 0;
		}

		// unexpected error message
		if ((await this.overwrites.count('*')) !== 0)
			throw new Error(`overwrites.count('*') should be zero!! please check your remove method`);

		this.__logger__!.info('the overwrites cache seems to be alright.');
	}
}
