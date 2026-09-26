import type { EntitlementStructure } from '../client/transformers';
import type { ObjectToLower } from '../common';
import type { APIEntitlement } from '../types';
import { EntitlementType } from '../types';
import { DiscordBase } from './extra/DiscordBase';

export interface Entitlement extends ObjectToLower<APIEntitlement> {}

export class Entitlement extends DiscordBase<APIEntitlement> {
	get startsAtTimestamp() {
		return this.startsAt ? Date.parse(this.startsAt) : null;
	}

	get endsAtTimestamp() {
		return this.endsAt ? Date.parse(this.endsAt) : null;
	}

	get startsAtDate(): Date | null {
		return this.startsAt ? new Date(this.startsAt) : null;
	}

	get endsAtDate(): Date | null {
		return this.endsAt ? new Date(this.endsAt) : null;
	}

	// Test entitlements are bought in test mode, real ones come through purchases,
	// gifts and subscriptions. The type enum is the only marker Discord gives.
	get isTestEntitlement(): boolean {
		return this.type === EntitlementType.TestModePurchase;
	}

	get isDeleted(): boolean {
		return this.deleted;
	}

	// Ended means Discord stamped an endsAt in the past.
	get isEnded(): boolean {
		if (!this.endsAt) return false;
		return Date.parse(this.endsAt) <= Date.now();
	}

	get isConsumed(): boolean {
		return this.consumed ?? false;
	}

	fetch(): Promise<EntitlementStructure> {
		return this.client.applications.fetchEntitlement(this.id);
	}

	consume() {
		return this.client.applications.consumeEntitlement(this.id);
	}
}
