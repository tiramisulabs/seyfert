import { CacheFrom } from '../../cache';
import { type StageInstanceStructure, Transformers } from '../../client/transformers';
import type {
	APIStageInstance,
	RESTPatchAPIStageInstanceJSONBody,
	RESTPostAPIStageInstanceJSONBody,
} from '../../types';
import { createValidationMetadata, SeyfertError } from '../it/error';
import { BaseShorter } from './base';

function assertTopic(topic: unknown, channelId: string) {
	// Discord only accepts a short plain topic here, keep the check local so a
	// typo fails before the request leaves instead of coming back as a 400.
	if (typeof topic !== 'string' || topic.length < 1 || topic.length > 120) {
		throw new SeyfertError('INVALID_STAGE_INSTANCE_TOPIC', {
			metadata: {
				...createValidationMetadata('a topic between 1 and 120 characters', topic, { channelId }),
				detail: `Stage instance topic for channel ${channelId} must be between 1 and 120 characters.`,
			},
		});
	}
}

/**
 * High level helper around the stage instance endpoints.
 *
 * Discord addresses every instance route by its stage channel, not by the
 * instance id from the payload, so this shorter (and the cache behind it) is
 * keyed by channel id to match
 * https://docs.discord.com/developers/resources/stage-instance.
 */
export class StageInstanceShorter extends BaseShorter {
	/**
	 * Fetches the live stage instance of a stage channel.
	 * @param channelId The stage channel id.
	 * @param force Skip the cache and hit Discord directly.
	 */
	async fetch(channelId: string, force = false): Promise<StageInstanceStructure> {
		return Transformers.StageInstance(this.client, await this.raw(channelId, force));
	}

	/**
	 * Fetches the live stage instance of a stage channel without transforming it.
	 * @param channelId The stage channel id.
	 * @param force Skip the cache and hit Discord directly.
	 */
	async raw(channelId: string, force = false): Promise<APIStageInstance> {
		if (!force) {
			const cached = await this.client.cache.stageInstances?.raw(channelId);
			if (cached) return cached;
		}

		const instance = await this.client.proxy['stage-instances'](channelId).get();
		await this.client.cache.stageInstances?.set(CacheFrom.Rest, channelId, instance.guild_id, instance);
		return (await this.client.cache.stageInstances?.raw(channelId)) ?? instance;
	}

	/**
	 * Creates a stage instance, making the stage channel go live.
	 * @param body The stage channel, topic and optional privacy settings.
	 * @param reason The audit-log reason.
	 */
	async create(body: RESTPostAPIStageInstanceJSONBody, reason?: string): Promise<StageInstanceStructure> {
		assertTopic(body.topic, body.channel_id);
		const instance = await this.client.proxy['stage-instances'].post({ body, reason });
		await this.client.cache.stageInstances?.set(CacheFrom.Rest, instance.channel_id, instance.guild_id, instance);
		return Transformers.StageInstance(this.client, instance);
	}

	/**
	 * Edits the topic or privacy level of a live stage instance.
	 * @param channelId The stage channel id.
	 * @param body The fields to update.
	 * @param reason The audit-log reason.
	 */
	async edit(
		channelId: string,
		body: RESTPatchAPIStageInstanceJSONBody,
		reason?: string,
	): Promise<StageInstanceStructure> {
		if (body.topic !== undefined) assertTopic(body.topic, channelId);
		const instance = await this.client.proxy['stage-instances'](channelId).patch({ body, reason });
		// Let the gateway event win when guild state is cached. Writing here
		// first would leave the update hook with no previous value to report.
		await this.client.cache.stageInstances?.setIfNI(CacheFrom.Rest, 'Guilds', channelId, instance.guild_id, instance);
		return Transformers.StageInstance(this.client, instance);
	}

	/**
	 * Deletes a stage instance, ending the live stage.
	 * @param channelId The stage channel id.
	 * @param reason The audit-log reason.
	 */
	async delete(channelId: string, reason?: string) {
		await this.client.proxy['stage-instances'](channelId).delete({ reason });
		await this.client.cache.stageInstances?.removeIfNI('Guilds', channelId, '');
	}
}
