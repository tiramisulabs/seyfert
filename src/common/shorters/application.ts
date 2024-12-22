import { type EntitlementStructure, Transformers } from '../../client';
import type {
	APIEntitlement,
	RESTGetAPIEntitlementsQuery,
	RESTPostAPIApplicationEmojiJSONBody,
	RESTPostAPIEntitlementBody,
} from '../../types';
import { BaseShorter } from './base';

export class ApplicationShorter extends BaseShorter {
	/**
	 * Lists the emojis for the application.
	 * @param applicationId The ID of the application.
	 * @returns The emojis.
	 */
	listEmojis(applicationId: string) {
		return this.client.proxy.applications(applicationId).emojis.get();
	}
	/**
	 * Gets an emoji for the application.
	 * @param applicationId The ID of the application.
	 * @param emojiId The ID of the emoji.
	 * @returns The emoji.
	 */
	getEmoji(applicationId: string, emojiId: string) {
		return this.client.proxy.applications(applicationId).emojis(emojiId).get();
	}

	/**
	 * Creates a new emoji for the application.
	 * @param applicationId The ID of the application.
	 * @param body.name The name of the emoji.
	 * @param body.image The [image data string](https://discord.com/developers/docs/reference#image-data) of the emoji.
	 * @returns The created emoji.
	 */
	createEmoji(applicationId: string, body: RESTPostAPIApplicationEmojiJSONBody) {
		return this.client.proxy.applications(applicationId).emojis.post({ body });
	}

	/**
	 * Lists the entitlements for the application.
	 * @param applicationId The ID of the application.
	 * @param [query] The query parameters.
	 */
	listEntitlements(applicationId: string, query?: RESTGetAPIEntitlementsQuery): Promise<EntitlementStructure[]> {
		return this.client.proxy
			.applications(applicationId)
			.entitlements.get({ query })
			.then(et => et.map(e => Transformers.Entitlement(this.client, e)));
	}

	/**
	 * Consumes an entitlement for the application.
	 * @param applicationId The ID of the application.
	 * @param entitlementId The ID of the entitlement.
	 */
	consumeEntitlement(applicationId: string, entitlementId: string) {
		return this.client.proxy.applications(applicationId).entitlements(entitlementId).consume.post();
	}

	/**
	 * Creates a test entitlement for the application.
	 * @param applicationId The ID of the application.
	 * @param body The body of the request.
	 */
	createTestEntitlement(applicationId: string, body: RESTPostAPIEntitlementBody): Promise<EntitlementStructure> {
		return this.client.proxy
			.applications(applicationId)
			.entitlements.post({ body })
			.then(et => Transformers.Entitlement(this.client, et as APIEntitlement));
	}

	/**
	 * Deletes a test entitlement for the application.
	 * @param applicationId The ID of the application.
	 * @param entitlementId The ID of the entitlement.
	 */
	deleteTestEntitlement(applicationId: string, entitlementId: string) {
		return this.client.proxy.applications(applicationId).entitlements(entitlementId).delete();
	}

	/**
	 * Lists the SKUs for the application.
	 * @param applicationId The ID of the application.
	 * @returns The SKUs.
	 */
	listSKUs(applicationId: string) {
		return this.client.proxy.applications(applicationId).skus.get();
	}
}
