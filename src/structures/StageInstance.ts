import type { ReturnCache } from '../cache';
import type { GuildStructure, StageInstanceStructure } from '../client/transformers';
import type { UsingClient } from '../commands';
import type { MethodContext, ObjectToLower } from '../common';
import type { APIStageInstance, RESTPatchAPIStageInstanceJSONBody, RESTPostAPIStageInstanceJSONBody } from '../types';
import { StageInstancePrivacyLevel } from '../types';
import { DiscordBase } from './extra/DiscordBase';

export interface StageInstance extends DiscordBase, ObjectToLower<APIStageInstance> {}

/**
 * A live stage in a stage channel.
 *
 * Discord keys the fetch/edit/delete routes by channel, while the payload
 * carries its own instance id. The structure keeps both around so callers can
 * work from either side without digging through raw payloads.
 *
 * https://docs.discord.com/developers/resources/stage-instance#stage-instance-object
 */
export class StageInstance extends DiscordBase<APIStageInstance> {
	declare privacyLevel: StageInstancePrivacyLevel;

	/** Short check for the only usable privacy level Discord documents right now. */
	get isGuildOnly(): boolean {
		return this.privacyLevel === StageInstancePrivacyLevel.GuildOnly;
	}

	/** The stage channel this instance is live in. */
	channel(mode?: 'rest' | 'flow'): Promise<StageInstanceChannelResult>;
	channel(mode: 'cache'): ReturnCache<StageInstanceChannelResult | undefined>;
	channel(mode: 'cache' | 'rest' | 'flow' = 'flow'): unknown {
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.channels?.get(this.channelId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as never) : undefined)
				);
			default:
				return this.client.channels.fetch(this.channelId, mode === 'rest');
		}
	}

	/** The guild that owns the stage channel. */
	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;
	guild(mode: 'cache' | 'rest' | 'flow' = 'flow'): unknown {
		switch (mode) {
			case 'cache':
				return (
					this.client.cache.guilds?.get(this.guildId) ||
					(this.client.cache.adapter.isAsync ? (Promise.resolve() as never) : undefined)
				);
			default:
				return this.client.guilds.fetch(this.guildId, mode === 'rest');
		}
	}

	/**
	 * Refetches this stage instance from Discord.
	 */
	fetch(): Promise<StageInstanceStructure> {
		return this.client.stageInstances.fetch(this.channelId);
	}

	/**
	 * Edits the topic or privacy level of this stage instance.
	 * @param body The fields to update.
	 * @param reason The audit-log reason.
	 */
	edit(body: RESTPatchAPIStageInstanceJSONBody, reason?: string): Promise<StageInstanceStructure> {
		return this.client.stageInstances.edit(this.channelId, body, reason);
	}

	/**
	 * Deletes this stage instance, ending the live stage.
	 * @param reason The audit-log reason.
	 */
	delete(reason?: string) {
		return this.client.stageInstances.delete(this.channelId, reason);
	}

	static methods({ client, channelId }: MethodContext<{ channelId: string }>) {
		return {
			fetch: (): Promise<StageInstanceStructure> => client.stageInstances.fetch(channelId),
			edit: (body: RESTPatchAPIStageInstanceJSONBody, reason?: string): Promise<StageInstanceStructure> =>
				client.stageInstances.edit(channelId, body, reason),
			delete: (reason?: string) => client.stageInstances.delete(channelId, reason),
		};
	}
}

type StageInstanceChannelResult = Awaited<ReturnType<UsingClient['channels']['fetch']>>;

export type StageInstanceCreateBody = RESTPostAPIStageInstanceJSONBody;
export type StageInstanceEditBody = RESTPatchAPIStageInstanceJSONBody;
