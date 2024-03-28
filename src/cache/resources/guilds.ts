import type { APIGuild } from 'discord-api-types/v10';
import type { Cache, ReturnCache } from '..';
import { fakePromise } from '../../common';
import { Guild } from '../../structures';
import { BaseResource } from './default/base';

export class Guilds extends BaseResource {
	namespace = 'guild';

	override get(id: string): ReturnCache<Guild<'cached'> | undefined> {
		return fakePromise(super.get(id)).then(guild => (guild ? new Guild<'cached'>(this.client, guild) : undefined));
	}

	override bulk(ids: string[]): ReturnCache<Guild<'cached'>[]> {
		return fakePromise(super.bulk(ids) as APIGuild[]).then(guilds =>
			guilds.map(x => new Guild<'cached'>(this.client, x)),
		);
	}

	override values(): ReturnCache<Guild<'cached'>[]> {
		return fakePromise(super.values() as APIGuild[]).then(guilds =>
			guilds.map(x => new Guild<'cached'>(this.client, x)),
		);
	}

	override async remove(id: string) {
		await this.cache.adapter.remove(
			(
				await Promise.all([
					this.cache.members?.keys(id) ?? [],
					this.cache.roles?.keys(id) ?? [],
					this.cache.channels?.keys(id) ?? [],
					this.cache.emojis?.keys(id) ?? [],
					this.cache.stickers?.keys(id) ?? [],
					this.cache.voiceStates?.keys(id) ?? [],
					this.cache.presences?.keys(id) ?? [],
					this.cache.threads?.keys(id) ?? [],
					this.cache.stageInstances?.keys(id) ?? [],
				])
			).flat(),
		);

		await this.cache.adapter.removeRelationship(
			[
				this.cache.members?.hashId(id),
				this.cache.roles?.hashId(id),
				this.cache.channels?.hashId(id),
				this.cache.emojis?.hashId(id),
				this.cache.stickers?.hashId(id),
				this.cache.voiceStates?.hashId(id),
				this.cache.presences?.hashId(id),
				this.cache.threads?.hashId(id),
				this.cache.stageInstances?.hashId(id),
			].filter(Boolean) as string[],
		);

		await super.remove(id);
	}

	override async set(id: string, data: any) {
		const bulkData: Parameters<Cache['bulkSet']>[0] = [];

		for (const member of data.members ?? []) {
			if (!member.user?.id) {
				continue;
			}
			bulkData.push(['members', member, member.user.id, id]);
			bulkData.push(['users', member.user, member.user.id]);
		}

		for (const role of data.roles ?? []) {
			bulkData.push(['roles', role, role.id, id]);
		}

		for (const channel of data.channels ?? []) {
			bulkData.push(['channels', channel, channel.id, id]);
			if (channel.permission_overwrites?.length)
				bulkData.push(['overwrites', channel.permission_overwrites, channel.id, id]);
		}

		for (const emoji of data.emojis ?? []) {
			bulkData.push(['emojis', emoji, emoji.id, id]);
		}

		for (const sticker of data.stickers ?? []) {
			bulkData.push(['stickers', sticker, sticker.id, id]);
		}

		for (const voiceState of data.voice_states ?? []) {
			bulkData.push(['voiceStates', voiceState, voiceState.user_id, id]);
		}

		for (const presence of data.presences ?? []) {
			bulkData.push(['presences', presence, presence.user.id, id]);
		}

		for (const thread of data.threads ?? []) {
			bulkData.push(['threads', thread, thread.id, id]);
		}

		for (const instance of data.stage_instances ?? []) {
			bulkData.push(['stageInstances', instance, instance.id, id]);
		}

		const {
			voice_states,
			members,
			channels,
			threads,
			presences,
			stage_instances,
			guild_scheduled_events,
			roles,
			emojis,
			stickers,
			guild_hashes,
			...guild
		} = data;

		bulkData.push(['guilds', guild, id]);

		await this.cache.bulkSet(bulkData);
	}

	override async patch(id: string, data: any) {
		const bulkData: Parameters<Cache['bulkPatch']>[0] = [];

		for (const member of data.members ?? []) {
			if (!member.user?.id) {
				continue;
			}
			bulkData.push(['members', member, member.user.id, id]);
			bulkData.push(['users', member.user, member.user.id]);
		}

		for (const role of data.roles ?? []) {
			bulkData.push(['roles', role, role.id, id]);
		}

		for (const channel of data.channels ?? []) {
			bulkData.push(['channels', channel, channel.id, id]);
		}

		for (const channel of data.channels ?? []) {
			if (channel.permission_overwrites?.length) {
				bulkData.push(['overwrites', channel.permission_overwrites, channel.id, id]);
			}
		}

		for (const emoji of data.emojis ?? []) {
			bulkData.push(['emojis', emoji, emoji.id, id]);
		}

		for (const sticker of data.stickers ?? []) {
			bulkData.push(['stickers', sticker, sticker.id, id]);
		}

		for (const voiceState of data.voice_states ?? []) {
			bulkData.push(['voiceStates', voiceState, voiceState.user_id, id]);
		}

		for (const presence of data.presences ?? []) {
			bulkData.push(['presences', presence, presence.user.id, id]);
		}

		for (const thread of data.threads ?? []) {
			bulkData.push(['threads', thread, thread.id, id]);
		}

		for (const instance of data.stage_instances ?? []) {
			bulkData.push(['stageInstances', instance, instance.id, id]);
		}

		const {
			voice_states,
			members,
			channels,
			threads,
			presences,
			stage_instances,
			guild_scheduled_events,
			roles,
			emojis,
			stickers,
			guild_hashes,
			...guild
		} = data;

		bulkData.push(['guilds', guild, id]);

		await this.cache.bulkPatch(bulkData);
	}
}
