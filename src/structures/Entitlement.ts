import type { ObjectToLower } from '../common';
import type { APIEntitlement } from '../types';
import { DiscordBase } from './extra/DiscordBase';

export interface Entitlement extends ObjectToLower<APIEntitlement> {}

export class Entitlement extends DiscordBase<APIEntitlement> {
	get startsAtTimestamp() {
		return this.startsAt ? Date.parse(this.startsAt) : null;
	}

	get endsAtTimestamp() {
		return this.endsAt ? Date.parse(this.endsAt) : null;
	}

	consume() {
		return this.client.applications.consumeEntitlement(this.applicationId, this.id);
	}
}
