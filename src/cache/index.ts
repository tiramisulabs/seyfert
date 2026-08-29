import { createPluginConflictError } from '../client/plugins/errors';
import type { InternalOptions, UsingClient } from '../commands';
import { type Awaitable, type If, type Logger, SeyfertError } from '../common';
import { type APIEmoji, type APISticker, ChannelType, type GatewayDispatchPayload, GatewayIntentBits } from '../types';
import type { Adapter } from './adapters';
import { testCacheAdapter } from './conformance';
import { Bans } from './resources/bans';
import { Channels } from './resources/channels';
import { Emojis } from './resources/emojis';
import { Guilds } from './resources/guilds';
import { Members } from './resources/members';
import { Messages } from './resources/messages';
import { Overwrites } from './resources/overwrites';
import { Presences } from './resources/presence';
import { Roles } from './resources/roles';
import { StageInstances } from './resources/stage-instances';
import { Stickers } from './resources/stickers';
import { Users } from './resources/users';
import { VoiceStates } from './resources/voice-states';

export { BaseResource } from './resources/default/base';
export { GuildBasedResource } from './resources/default/guild-based';
export { GuildRelatedResource } from './resources/default/guild-related';

export type InferAsyncCache = InternalOptions extends { asyncCache: infer P } ? P : false;
export type ReturnCache<T> = If<InferAsyncCache, Promise<T>, T>;

// GuildBased
export type GuildBased = 'members' | 'voiceStates' | 'bans';

// ClientGuildBased
export type GuildRelated =
	| 'emojis'
	| 'roles'
	| 'channels'
	| 'stickers'
	| 'presences'
	| 'stageInstances'
	| 'overwrites'
	| 'messages';

// ClientBased
export type NonGuildBased = 'users' | 'guilds';

// ClientBased
export type SeyfertBased = 'onPacket';

type ReturnManagers = {
	[K in NonGuildBased | GuildBased | GuildRelated]: NonNullable<Awaited<ReturnType<NonNullable<Cache[K]>['get']>>>;
};

export type BulkGetKey =
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
	  ];

type BulkGetResult<K extends BulkGetKey[0] = BulkGetKey[0]> = Partial<{
	[P in K]: ReturnManagers[P][];
}>;

type BulkMutationEntry =
	| readonly [CacheFrom, NonGuildBased, data: any, sourceId: string]
	| readonly [CacheFrom, GuildBased | GuildRelated, data: any, sourceId: string, guildId: string];

type PluginCacheResourceContributionLike = {
	name: string;
	record?: { identity: string; index: number; plugin: { name: string; instanceId?: string } };
	resource: new (cache: Cache, client: UsingClient) => unknown;
	onPacket?: (event: GatewayDispatchPayload, cache: Cache) => Awaitable<void>;
	sequence: number;
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
	| 'VOICE_CHANNEL_STATUS_UPDATE'
	| 'VOICE_STATE_UPDATE'
	| 'STAGE_INSTANCE_CREATE'
	| 'STAGE_INSTANCE_UPDATE'
	| 'STAGE_INSTANCE_DELETE'
	| 'GUILD_MEMBERS_CHUNK';

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
	private pluginResourceNames = new Set<string>();
	private pluginResourcePacketHandlers: {
		handler: (event: GatewayDispatchPayload, cache: Cache) => Awaitable<void>;
		plugin: string;
	}[] = [];
	private pluginResourcePacketErrorLogger?: (plugin: string, error: unknown) => void;

	constructor(
		public intents: number,
		public adapter: Adapter,
		disabledCache: DisabledCache,
		client: UsingClient,
	) {
		this.buildCache(disabledCache, client);
	}

	private reservedResourceNames() {
		const names = new Set<string>();
		for (let target: object | null = this; target; target = Object.getPrototypeOf(target)) {
			for (const key of Reflect.ownKeys(target)) {
				if (typeof key === 'string' && !this.pluginResourceNames.has(key)) names.add(key);
			}
		}
		return names;
	}

	buildCache(disabledCache: DisabledCache, client: UsingClient) {
		const pluginResources = [
			...((client as { pluginRegistry?: { cacheResources?: PluginCacheResourceContributionLike[] } }).pluginRegistry
				?.cacheResources ?? []),
		].sort((left, right) => left.sequence - right.sequence);
		const reservedResourceNames = this.reservedResourceNames();
		for (const contribution of pluginResources) {
			if (!reservedResourceNames.has(contribution.name)) continue;
			throw createPluginConflictError(
				contribution.record?.plugin.name ?? contribution.name,
				'cache.resource',
				contribution.record?.index ?? -1,
				`Cache resource "${contribution.name}" conflicts with the Cache runtime surface.`,
				contribution.record?.plugin.instanceId,
			);
		}

		for (const name of this.pluginResourceNames) {
			delete (this as Record<string, unknown>)[name];
		}
		this.pluginResourceNames.clear();
		this.pluginResourcePacketHandlers = [];
		this.pluginResourcePacketErrorLogger = (client as { logger?: Pick<Logger, 'error'> }).logger
			? (plugin, error) =>
					(client as { logger: Pick<Logger, 'error'> }).logger.error(
						`[plugin:${plugin}] cache.resource.onPacket failed`,
						error,
					)
			: undefined;

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
			: this.onPacketWithPluginResources.bind(this);

		for (const contribution of pluginResources) {
			(this as Record<string, unknown>)[contribution.name] = new contribution.resource(this, client);
			this.pluginResourceNames.add(contribution.name);
			if (contribution.onPacket) {
				this.pluginResourcePacketHandlers.push({
					handler: contribution.onPacket,
					plugin: contribution.record?.identity ?? contribution.name,
				});
			}
		}
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

	get hasPresenceUpdates() {
		return this.hasIntent('GuildPresences');
	}

	get hasDirectMessages() {
		return this.hasIntent('DirectMessages');
	}

	get hasModerationIntent() {
		return this.hasIntent('GuildModeration');
	}

	async bulkGet<const Keys extends readonly BulkGetKey[]>(keys: Keys): Promise<BulkGetResult<Keys[number][0]>> {
		const allData: Partial<Record<BulkGetKey[0], string[][]>> = {};
		for (const [type, id, guildId] of keys) {
			switch (type) {
				case 'messages':
				case 'bans':
				case 'voiceStates':
				case 'members':
					{
						if (!allData[type]) {
							allData[type] = [];
						}
						allData[type]!.push([id, guildId!]);
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
					{
						if (!allData[type]) {
							allData[type] = [];
						}
						allData[type]!.push([id]);
					}
					break;
				default:
					throw new SeyfertError('INTERNAL_ERROR', { metadata: { detail: `Invalid type ${type}` } });
			}
		}

		const obj: BulkGetResult = {};

		for (const i in allData) {
			const key = i as BulkGetKey[0];
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

		return obj as BulkGetResult<Keys[number][0]>;
	}

	private prepareBulkMutation(keys: BulkMutationEntry[]) {
		const allData: [string, any][] = [];
		const relationshipsData: Record<string, string[]> = {};
		for (const [from, type, data, id, guildId] of keys) {
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
						if (!this[type]?.filter(data, id, guildId, from)) continue;
						const hashId = this[type]?.hashId(guildId!);
						if (!hashId) {
							continue;
						}
						if (!(hashId in relationshipsData)) {
							relationshipsData[hashId] = [];
						}
						relationshipsData[hashId].push(id);
						if (type !== 'overwrites' && type !== 'messages') {
							data.guild_id = guildId;
						}
						if (type === 'messages' && data?.author?.id && this.users?.filter(data.author, data.author.id, from)) {
							const userHashId = this.users.namespace;
							if (!(userHashId in relationshipsData)) {
								relationshipsData[userHashId] = [];
							}
							relationshipsData[userHashId].push(data.author.id);
							allData.push([this.users.hashId(data.author.id), data.author]);
						}
						allData.push([this[type]!.hashId(id), this[type]!.parse(data, id, guildId!)]);
					}
					break;
				case 'bans':
				case 'voiceStates':
				case 'members':
					{
						if (!this[type]?.filter(data, id, guildId, from)) continue;
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
						if (!this[type]?.filter(data, id, from)) continue;
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
					throw new SeyfertError('INTERNAL_ERROR', { metadata: { detail: `Invalid type ${type}` } });
			}
		}
		return { data: allData, relationships: relationshipsData };
	}

	async bulkPatch(keys: BulkMutationEntry[]) {
		const mutation = this.prepareBulkMutation(keys);
		await this.adapter.bulkAddToRelationShip(mutation.relationships);
		await this.adapter.bulkPatch(mutation.data);
	}

	async bulkSet(keys: BulkMutationEntry[]) {
		const mutation = this.prepareBulkMutation(keys);
		await this.adapter.bulkAddToRelationShip(mutation.relationships);
		await this.adapter.bulkSet(mutation.data);
	}

	onPacket(event: GatewayDispatchPayload) {
		return this.onPacketWithPluginResources(event);
	}

	private async onPacketWithPluginResources(event: GatewayDispatchPayload) {
		await this.onPacketDefault(event);
		for (const contribution of this.pluginResourcePacketHandlers) {
			try {
				await contribution.handler(event, this);
			} catch (error) {
				this.pluginResourcePacketErrorLogger?.(contribution.plugin, error);
			}
		}
	}

	protected async onPacketDefault(event: GatewayDispatchPayload) {
		switch (event.t) {
			case 'READY':
				await this.users?.set(CacheFrom.Gateway, event.d.user.id, event.d.user);
				break;
			case 'GUILD_CREATE':
			case 'GUILD_UPDATE':
			case 'RAW_GUILD_CREATE':
				await this.guilds?.patch(CacheFrom.Gateway, event.d.id, { unavailable: false, ...event.d });
				break;
			case 'GUILD_DELETE':
			case 'RAW_GUILD_DELETE':
				if (event.d.unavailable) {
					await this.guilds?.patch(CacheFrom.Gateway, event.d.id, event.d);
				} else {
					await this.guilds?.remove(event.d.id);
				}
				break;
			case 'CHANNEL_CREATE':
			case 'CHANNEL_UPDATE':
				{
					if ('guild_id' in event.d) {
						await this.channels?.set(CacheFrom.Gateway, event.d.id, event.d.guild_id!, event.d);
						if (event.d.permission_overwrites?.length)
							await this.overwrites?.set(
								CacheFrom.Gateway,
								event.d.id,
								event.d.guild_id!,
								event.d.permission_overwrites,
							);
					} else if (event.d.type === ChannelType.DM) {
						await this.channels?.set(CacheFrom.Gateway, event.d.recipients![0]?.id, '@me', event.d);
					}
				}
				break;
			case 'CHANNEL_DELETE':
				await this.channels?.remove(event.d.id, 'guild_id' in event.d ? event.d.guild_id! : '@me');
				break;
			case 'GUILD_ROLE_CREATE':
			case 'GUILD_ROLE_UPDATE':
				await this.roles?.set(CacheFrom.Gateway, event.d.role.id, event.d.guild_id, event.d.role);
				break;
			case 'GUILD_ROLE_DELETE':
				await this.roles?.remove(event.d.role_id, event.d.guild_id);
				break;
			case 'GUILD_BAN_ADD':
				await this.bans?.set(CacheFrom.Gateway, event.d.user.id, event.d.guild_id, event.d);
				break;
			case 'GUILD_BAN_REMOVE':
				await this.bans?.remove(event.d.user.id, event.d.guild_id);
				break;
			case 'GUILD_EMOJIS_UPDATE':
				{
					await this.emojis?.remove(await this.emojis?.keys(event.d.guild_id), event.d.guild_id);
					await this.emojis?.set(
						CacheFrom.Gateway,
						event.d.emojis.map(x => [x.id!, x] as [string, APIEmoji]),
						event.d.guild_id,
					);
				}
				break;
			case 'GUILD_STICKERS_UPDATE':
				{
					await this.stickers?.remove(await this.stickers?.keys(event.d.guild_id), event.d.guild_id);
					await this.stickers?.set(
						CacheFrom.Gateway,
						event.d.stickers.map(x => [x.id, x] as [string, APISticker]),
						event.d.guild_id,
					);
				}
				break;
			case 'GUILD_MEMBERS_CHUNK': {
				const data: Parameters<Cache['bulkSet']>[0] = [];

				if (this.members) {
					for (const member of event.d.members) {
						data.push(
							[CacheFrom.Gateway, 'members', member, member.user.id, event.d.guild_id],
							[CacheFrom.Gateway, 'users', member.user, member.user.id],
						);
					}
				}

				if (this.presences && event.d.presences) {
					for (const presence of event.d.presences) {
						data.push([CacheFrom.Gateway, 'presences', presence, presence.user.id, event.d.guild_id]);
					}
				}

				if (data.length) {
					await this.bulkSet(data);
				}
				break;
			}
			case 'GUILD_MEMBER_ADD':
			case 'GUILD_MEMBER_UPDATE':
				if (event.d.user) await this.members?.set(CacheFrom.Gateway, event.d.user.id, event.d.guild_id, event.d);
				break;
			case 'GUILD_MEMBER_REMOVE':
				await this.members?.remove(event.d.user.id, event.d.guild_id);
				break;

			case 'PRESENCE_UPDATE':
				// Should update member data?
				await this.presences?.set(CacheFrom.Gateway, event.d.user.id, event.d.guild_id, event.d);
				break;

			case 'THREAD_CREATE':
			case 'THREAD_UPDATE':
				{
					if (event.d.guild_id) await this.channels?.set(CacheFrom.Gateway, event.d.id, event.d.guild_id, event.d);
					if (event.d.permission_overwrites?.length)
						await this.overwrites?.set(CacheFrom.Gateway, event.d.id, event.d.guild_id!, event.d.permission_overwrites);
				}
				break;

			case 'THREAD_DELETE':
				await this.channels?.remove(event.d.id, event.d.guild_id);
				break;

			case 'USER_UPDATE':
				await this.users?.set(CacheFrom.Gateway, event.d.id, event.d);
				break;

			case 'VOICE_STATE_UPDATE':
				{
					if (!event.d.guild_id) {
						return;
					}

					if (event.d.channel_id != null) {
						await this.voiceStates?.set(CacheFrom.Gateway, event.d.user_id, event.d.guild_id, event.d);
					} else {
						await this.voiceStates?.remove(event.d.user_id, event.d.guild_id);
					}
				}
				break;
			case 'VOICE_CHANNEL_STATUS_UPDATE':
				await this.channels?.patch(CacheFrom.Gateway, event.d.id, event.d.guild_id, {
					status: event.d.status ?? null,
				});
				break;
			case 'STAGE_INSTANCE_CREATE':
			case 'STAGE_INSTANCE_UPDATE':
				await this.stageInstances?.set(CacheFrom.Gateway, event.d.id, event.d.guild_id, event.d);
				break;
			case 'STAGE_INSTANCE_DELETE':
				await this.stageInstances?.remove(event.d.id, event.d.guild_id);
				break;
			case 'MESSAGE_CREATE':
				{
					if (this.messages !== undefined) {
						const data: Parameters<Cache['bulkPatch']>[0] = [
							[CacheFrom.Gateway, 'messages', event.d, event.d.id, event.d.channel_id],
							[CacheFrom.Gateway, 'users', event.d.author, event.d.author.id],
						];

						if (event.d.guild_id) {
							if (event.d.member)
								data.push([CacheFrom.Gateway, 'members', event.d.member, event.d.author.id, event.d.guild_id]);
						}

						await this.bulkPatch(data);
					}
				}
				break;
			case 'MESSAGE_UPDATE':
				{
					if (this.messages !== undefined) {
						const data: Parameters<Cache['bulkPatch']>[0] = [
							[CacheFrom.Gateway, 'messages', event.d, event.d.id, event.d.channel_id],
							[CacheFrom.Gateway, 'users', event.d.author, event.d.author.id],
						];

						if (event.d.guild_id) {
							if (event.d.member)
								data.push([CacheFrom.Gateway, 'members', event.d.member, event.d.author.id, event.d.guild_id]);
						}

						await this.bulkPatch(data);
					}
				}
				break;
			case 'MESSAGE_DELETE':
				await this.messages?.remove(event.d.id, event.d.channel_id);
				break;
			case 'MESSAGE_DELETE_BULK':
				await this.messages?.remove(event.d.ids, event.d.channel_id);
				break;
		}
	}

	/**
	 * Destructively validates the adapter by flushing its complete storage before, during, and after the run.
	 *
	 * This partial conformance check covers only users, members, channels, and permission overwrites.
	 */
	testAdapter() {
		return testCacheAdapter(this, CacheFrom.Test);
	}
}

export enum CacheFrom {
	Gateway = 1,
	Rest,
	Test,
}
