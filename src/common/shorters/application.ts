import { CacheFrom, resolveImage } from '../..';
import { type ApplicationEmojiStructure, type EntitlementStructure, Transformers } from '../../client';
import type {
	APIEntitlement,
	RESTGetAPIEntitlementsQuery,
	RESTPatchAPIApplicationEmojiJSONBody,
	RESTPatchCurrentApplicationJSONBody,
	RESTPostAPIEntitlementBody,
} from '../../types';
import type { ApplicationEmojiResolvable } from '../types/resolvables';
import { BaseShorter } from './base';

export class ApplicationShorter extends BaseShorter {
	/**
	 * Lists the emojis for the application.
	 * @returns The emojis.
	 */
	async listEmojis(force = false): Promise<ApplicationEmojiStructure[]> {
		if (!force) {
			const cached = (await this.client.cache.emojis?.values(this.client.applicationId)) as
				| ApplicationEmojiStructure[]
				| undefined;
			if (cached?.length) return cached;
		}
		const data = await this.client.proxy.applications(this.client.applicationId).emojis.get();
		this.client.cache.emojis?.set(
			CacheFrom.Rest,
			data.items.map(e => [e.id, e]),
			this.client.applicationId,
		);
		return data.items.map(e => Transformers.ApplicationEmoji(this.client, e));
	}
	/**
	 * Gets an emoji for the application.
	 * @param emojiId The ID of the emoji.
	 * @returns The emoji.
	 */
	async getEmoji(emojiId: string, force = false): Promise<ApplicationEmojiStructure> {
		if (!force) {
			const cached = (await this.client.cache.emojis?.get(emojiId)) as ApplicationEmojiStructure;
			if (cached) return cached;
		}
		const data = await this.client.proxy.applications(this.client.applicationId).emojis(emojiId).get();
		this.client.cache.emojis?.set(CacheFrom.Rest, data.id, this.client.applicationId, data);
		return Transformers.ApplicationEmoji(this.client, data);
	}

	/**
	 * Creates a new emoji for the application.
	 * @param body.name The name of the emoji.
	 * @param body.image The [image data string](https://discord.com/developers/docs/reference#image-data) of the emoji.
	 * @returns The created emoji.
	 */
	async createEmoji(raw: ApplicationEmojiResolvable) {
		const data = await this.client.proxy
			.applications(this.client.applicationId)
			.emojis.post({ body: { ...raw, image: await resolveImage(raw.image) } });
		this.client.cache.emojis?.set(CacheFrom.Rest, data.id, this.client.applicationId, data);
		return Transformers.ApplicationEmoji(this.client, data);
	}

	/**
	 * Edits an emoji for the application.
	 * @param emojiId The ID of the emoji.
	 * @param body.name The new name of the emoji.
	 * @returns The edited emoji.
	 */
	async editEmoji(emojiId: string, body: RESTPatchAPIApplicationEmojiJSONBody) {
		const data = await this.client.proxy.applications(this.client.applicationId).emojis(emojiId).patch({ body });
		this.client.cache.emojis?.patch(CacheFrom.Rest, emojiId, this.client.applicationId, data);
		return Transformers.ApplicationEmoji(this.client, data);
	}

	/**
	 * Deletes an emoji for the application.
	 * @param emojiId The ID of the emoji.
	 */
	deleteEmoji(emojiId: string) {
		return this.client.proxy.applications(this.client.applicationId).emojis(emojiId).delete();
	}

	/**
	 * Lists the entitlements for the application.
	 * @param [query] The query parameters.
	 */
	listEntitlements(query?: RESTGetAPIEntitlementsQuery): Promise<EntitlementStructure[]> {
		return this.client.proxy
			.applications(this.client.applicationId)
			.entitlements.get({ query })
			.then(et => et.map(e => Transformers.Entitlement(this.client, e)));
	}

	/**
	 * Consumes an entitlement for the application.
	 * @param entitlementId The ID of the entitlement.
	 */
	consumeEntitlement(entitlementId: string) {
		return this.client.proxy.applications(this.client.applicationId).entitlements(entitlementId).consume.post();
	}

	/**
	 * Creates a test entitlement for the application.
	 * @param body The body of the request.
	 */
	createTestEntitlement(body: RESTPostAPIEntitlementBody): Promise<EntitlementStructure> {
		return this.client.proxy
			.applications(this.client.applicationId)
			.entitlements.post({ body })
			.then(et => Transformers.Entitlement(this.client, et as APIEntitlement));
	}

	/**
	 * Deletes a test entitlement for the application.
	 * @param entitlementId The ID of the entitlement.
	 */
	deleteTestEntitlement(entitlementId: string) {
		return this.client.proxy.applications(this.client.applicationId).entitlements(entitlementId).delete();
	}

	/**
	 * Lists the SKUs for the application.
	 * @returns The SKUs.
	 */
	listSKUs() {
		return this.client.proxy.applications(this.client.applicationId).skus.get();
	}

	async fetch() {
		const data = await this.client.proxy.applications('@me').get();
		return Transformers.Application(this.client, data);
	}

	async edit(body: RESTPatchCurrentApplicationJSONBody) {
		const data = await this.client.proxy.applications('@me').patch({ body });
		return Transformers.Application(this.client, data);
	}

	getActivityInstance(instanceId: string) {
		return this.client.proxy.applications(this.client.applicationId)['activity-instances'](instanceId).get();
	}
}
