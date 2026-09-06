import { Logger, SeyfertError } from '../common';
import {
	type APIChannel,
	type APIGuildMember,
	type APIOverwrite,
	type APITextChannel,
	type APIUser,
	ChannelType,
	GuildMemberFlags,
	OverwriteType,
} from '../types';
import type { Adapter } from './adapters';
import type { Cache, CacheFrom } from './index';

export async function testCacheAdapter(cache: Cache, source: CacheFrom) {
	return new CacheAdapterConformance(cache, source).run();
}

class CacheAdapterConformance {
	private fixtureId = 0;

	constructor(
		private readonly cache: Cache,
		private readonly source: CacheFrom,
	) {}

	private get adapter(): Adapter {
		return this.cache.adapter;
	}

	private get users(): Cache['users'] {
		return this.cache.users;
	}

	private get members(): Cache['members'] {
		return this.cache.members;
	}

	private get channels(): Cache['channels'] {
		return this.cache.channels;
	}

	private get overwrites(): Cache['overwrites'] {
		return this.cache.overwrites;
	}

	private get __logger__(): Logger | undefined {
		return this.cache.__logger__;
	}

	private set __logger__(logger: Logger | undefined) {
		this.cache.__logger__ = logger;
	}

	private nextFixtureId() {
		return `${++this.fixtureId}`.padStart(18, '0');
	}

	async run() {
		this.__logger__ ??= new Logger({
			name: '[CACHE]',
		});
		await this.adapter.flush();
		// this method will only check the cache for `users`, `members`, and `channels`
		// likewise these have the three types of resources (GuildRelatedResource, GuildBasedResource, BaseResource)
		// will also check `overwrites`, since the latter stores an array not as an object but as data.

		await this.testUsersAndMembers();
		await this.testChannelsAndOverwrites();

		this.__logger__.info('The adapter seems to work properly');
		this.__logger__.debug('Flushing adapter');

		delete this.cache.__logger__;

		await this.adapter.flush();
	}

	private async testUsersAndMembers() {
		if (!this.users)
			throw new SeyfertError('CACHE_USERS_DISABLED', {
				metadata: { detail: 'Users cache disabled, you should enable it for this.' },
			});
		if (!this.members)
			throw new SeyfertError('CACHE_MEMBERS_DISABLED', {
				metadata: { detail: 'Members cache disabled, you should enable it for this.' },
			});

		const createUser = (name: string): APIUser => {
			return {
				avatar: 'xdxd',
				discriminator: '0',
				global_name: name,
				id: this.nextFixtureId(),
				username: `@seyfert/${name}`,
			};
		};
		const createMember = (name: string): APIGuildMember => {
			return {
				banner: null,
				avatar: 'xdxd',
				deaf: !false,
				flags: GuildMemberFlags.StartedHomeActions,
				joined_at: '2024-01-01T00:00:00.000Z',
				mute: !true,
				roles: ['111111111111'],
				user: createUser(name),
			};
		};
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
			await this.users.set(this.source, user.id, user);
		}
		let count = 0;
		if ((await this.users.values()).length !== users.length)
			throw new SeyfertError('CACHE_USERS_VALUES_SIZE_MISMATCH', {
				metadata: { detail: 'users.values() is not of the expected size.' },
			});
		if ((await this.users.count()) !== users.length)
			throw new SeyfertError('CACHE_USERS_COUNT_MISMATCH', {
				metadata: { detail: 'users.count() is not of the expected amount' },
			});
		for (const user of users) {
			const cache = await this.users.raw(user.id);
			if (!cache)
				throw new SeyfertError('INTERNAL_ERROR', {
					metadata: { detail: `users.raw(${user.id}) has returned undefined!!!!!!` },
				});
			if (cache.username !== user.username)
				throw new SeyfertError('INTERNAL_ERROR', {
					metadata: {
						detail: `users.raw(${user.id}).username is not of the expected value!!!!! (cache (${cache.username})) (expected value: (${user.username}))`,
					},
				});
			if (cache.id !== user.id)
				throw new SeyfertError('INTERNAL_ERROR', {
					metadata: {
						detail: `users.raw(${user.id}).id is not of the expected value!!!!!! (cache (${cache.id})) (expected value: (${user.id}))`,
					},
				});
			await this.users.remove(user.id);
			if ((await this.users.count()) !== users.length - ++count)
				throw new SeyfertError('INTERNAL_ERROR', {
					metadata: { detail: `users.count() should be ${users.length - count}!! please check your remove method` },
				});
		}

		this.__logger__!.info('the user cache seems to be alright.');
		this.__logger__!.debug('Flushing adapter to clear users cache.');

		await this.adapter.flush();

		// unexpected error message
		if ((await this.users.count()) !== 0)
			throw new SeyfertError('CACHE_USERS_COUNT_NOT_ZERO', {
				metadata: { detail: 'users.count() should be 0!! please check your flush method' },
			});

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
				await this.members.set(this.source, member.user.id, guildId, member);
			}
			if ((await this.members.values(guildId)).length !== members.length)
				throw new SeyfertError('CACHE_MEMBERS_GUILD_VALUES_SIZE_MISMATCH', {
					metadata: { detail: 'members.values(guildId) is not of the expected size.' },
				});
			if ((await this.members.count(guildId)) !== members.length)
				throw new SeyfertError('CACHE_MEMBERS_GUILD_COUNT_MISMATCH', {
					metadata: { detail: 'members.count(guildId) is not of the expected amount' },
				});
			for (const member of members) {
				const cache = await this.members.raw(member.user.id, guildId);
				if (!cache)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: { detail: `members.raw(${member.user.id}, ${guildId}) has returned undefined.` },
					});
				if (cache.roles[0] !== member.roles[0])
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: {
							detail: `members.raw(${member.user.id}, ${guildId}).roles[0] is not the expected value: ${member.roles[0]} (cache: ${cache.roles[0]})`,
						},
					});
				if (cache.user.username !== member.user.username)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: {
							detail: `members.raw(${member.user.id}, ${guildId}).user.username is not the expected value!!!!!! (cache (${cache.user.username})) (expected value: (${member.user.username}))`,
						},
					});
				if (cache.user.id !== member.user.id)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: {
							detail: `members.raw(${member.user.id}, ${guildId}).user.id is not the expected value!!!!!! (cache (${cache.user.id})) (expected value: (${member.user.id}))`,
						},
					});
			}
		}
		if ((await this.members.values('*')).length !== Object.values(guildMembers).flat().length)
			throw new SeyfertError('CACHE_MEMBERS_VALUES_SIZE_MISMATCH', {
				metadata: { detail: 'members.values(*) is not of the expected size' },
			});
		if ((await this.members.count('*')) !== Object.values(guildMembers).flat().length)
			throw new SeyfertError('CACHE_MEMBERS_GLOBAL_COUNT_MISMATCH', {
				metadata: { detail: 'the global amount of members.count(*) is not the expected amount' },
			});

		count = 0;
		for (const guildId in guildMembers) {
			const members = guildMembers[guildId];
			for (const member of members) {
				await this.members.remove(member.user.id, guildId);
				if ((await this.members.count(guildId)) !== members.length - ++count)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: {
							detail: `members.count(${guildId}) should be ${members.length - count}!! please check your remove method`,
						},
					});
			}
			count = 0;
		}

		await this.adapter.flush();

		// unexpected error message
		if ((await this.users.count()) !== 0)
			throw new SeyfertError('CACHE_USERS_COUNT_NOT_ZERO', {
				metadata: { detail: 'users.count() should be zero!! please check your flush method' },
			});
		// unexpected error message
		if ((await this.members.count('*')) !== 0)
			throw new SeyfertError('CACHE_MEMBERS_COUNT_NOT_ZERO', {
				metadata: { detail: "members.count('*') should be zero!! please check your flush method" },
			});

		this.__logger__!.info('the member cache seems to be alright.');
	}

	private async testChannelsAndOverwrites() {
		if (!this.channels)
			throw new SeyfertError('CACHE_CHANNELS_DISABLED', {
				metadata: { detail: 'Channels cache disabled, you should enable it for this.' },
			});
		if (!this.overwrites)
			throw new SeyfertError('CACHE_OVERWRITES_DISABLED', {
				metadata: { detail: 'Overwrites cache disabled, you should enable it for this.' },
			});

		const createChannel = (name: string): APITextChannel => {
			return {
				id: this.nextFixtureId(),
				name,
				type: ChannelType.GuildText,
				position: 0,
			};
		};

		const createOverwrites = (name: string): (APIOverwrite & { channel_id: string })[] => {
			const channel_id = this.nextFixtureId();
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
		};

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
				await this.channels.set(this.source, channel.id, guildId, channel);
			}
			if ((await this.channels.values(guildId)).length !== channels.length)
				throw new SeyfertError('CACHE_CHANNELS_GUILD_VALUES_SIZE_MISMATCH', {
					metadata: { detail: 'channels.values(guildId) is not of the expected size' },
				});
			if ((await this.channels.count(guildId)) !== channels.length)
				throw new SeyfertError('CACHE_CHANNELS_GUILD_COUNT_MISMATCH', {
					metadata: { detail: 'channels.count(guildId) is not of the expected amount' },
				});
			for (const channel of channels) {
				const cache = await this.channels.raw(channel.id);
				if (!cache)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: { detail: `channels.raw(${channel.id}) has returned undefined!!!!!!` },
					});
				if (cache.type !== ChannelType.GuildText)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: {
							detail: `channels.raw(${channel.id}).type is not of the expected type: ${channel.type}!!!!!!!! (mismatched type: ${cache.type})`,
						},
					});
				if (cache.name !== channel.name)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: {
							detail: `channels.raw(${channel.id}).name is not the expected value!!!!!! (cache (${cache.name})) (expected value: (${channel.name}))`,
						},
					});
				if (cache.id !== channel.id)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: {
							detail: `channels.raw(${channel.id}).id is not the expected value!!!!!! (cache (${cache.id})) (expected value: (${channel.id}))`,
						},
					});
			}
		}
		if ((await this.channels.values('*')).length !== Object.values(guildChannels).flat().length)
			throw new SeyfertError('CACHE_CHANNELS_VALUES_SIZE_MISMATCH', {
				metadata: { detail: 'channels.values(*) is not of the expected size' },
			});
		if ((await this.channels.count('*')) !== Object.values(guildChannels).flat().length)
			throw new SeyfertError('CACHE_CHANNELS_COUNT_MISMATCH', {
				metadata: { detail: 'channels.count(*) is not of the expected amount' },
			});

		let count = 0;
		for (const guildId in guildChannels) {
			const channels = guildChannels[guildId];
			for (const channel of channels) {
				await this.channels.remove(channel.id, guildId);
				if ((await this.channels.count(guildId)) !== channels.length - ++count)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: {
							detail: `channels.count(${guildId}) should be ${channels.length - count}!! please check your remove method`,
						},
					});
			}
			count = 0;
		}

		// unexpected error message
		if ((await this.channels.count('*')) !== 0)
			throw new SeyfertError('CACHE_CHANNELS_COUNT_NOT_ZERO', {
				metadata: { detail: `channels.count('*') should be zero!! please check your remove method` },
			});

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
				await this.overwrites.set(this.source, overwrites[0].channel_id, guildId, overwrites);
			}
			if ((await this.overwrites.values(guildId)).length !== bulkOverwrites.length)
				throw new SeyfertError('CACHE_OVERWRITES_CHANNEL_VALUES_SIZE_MISMATCH', {
					metadata: { detail: 'overwrites.values(channelId) is not of the expected size' },
				});
			if ((await this.overwrites.count(guildId)) !== bulkOverwrites.length)
				throw new SeyfertError('CACHE_OVERWRITES_CHANNEL_COUNT_MISMATCH', {
					metadata: { detail: 'overwrites.count(channelId) is not of the expected amount' },
				});
			for (const overwrites of bulkOverwrites) {
				const cache = await this.overwrites.raw(overwrites[0].channel_id);
				if (!cache)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: { detail: `overwrites.raw(${overwrites[0].channel_id}) has returned undefined!!!!!!` },
					});
				if (cache.length !== overwrites.length)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: {
							detail: `overwrites.raw(${overwrites[0].channel_id}).length is not of the expected length!!!!!! (cache (${cache.length})) (expected value: (${overwrites.length}))`,
						},
					});
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
						throw new SeyfertError('CACHE_OVERWRITE_NOT_FOUND', {
							metadata: { detail: "cache wasn't found in the overwrites cache" },
						});
				}
			}
		}

		count = 0;

		for (const guildId in guildOverwrites) {
			const bulkOverwrites = guildOverwrites[guildId];
			for (const overwrites of bulkOverwrites) {
				await this.overwrites.remove(overwrites[0].channel_id, guildId);
				if ((await this.overwrites.count(guildId)) !== bulkOverwrites.length - ++count)
					throw new SeyfertError('INTERNAL_ERROR', {
						metadata: {
							detail: `overwrites.count(${guildId}) should be ${overwrites.length - count}!! please check your remove method`,
						},
					});
			}
			count = 0;
		}

		// unexpected error message
		if ((await this.overwrites.count('*')) !== 0)
			throw new SeyfertError('CACHE_OVERWRITES_COUNT_NOT_ZERO', {
				metadata: { detail: `overwrites.count('*') should be zero!! please check your remove method` },
			});

		this.__logger__!.info('the overwrites cache seems to be alright.');
	}
}
