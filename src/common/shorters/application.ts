import { Entitlement } from '../../structures/Entitlement';
import type { RESTPostAPIEntitlementBody } from '../../types';
import { BaseShorter } from './base';

export class ApplicationShorter extends BaseShorter {
	async listEntitlements(applicationId: string) {
		return this.client.proxy
			.applications(applicationId)
			.entitlements.get()
			.then(et => et.map(e => new Entitlement(this.client, e)));
	}

	async consumeEntitlement(applicationId: string, entitlementId: string) {
		return this.client.proxy.applications(applicationId).entitlements(entitlementId).consume.post();
	}

	async createTestEntitlement(applicationId: string, body: RESTPostAPIEntitlementBody) {
		return this.client.proxy
			.applications(applicationId)
			.entitlements.post({ body })
			.then(et => new Entitlement(this.client, et as any));
	}

	async deleteTestEntitlement(applicationId: string, entitlementId: string) {
		return this.client.proxy.applications(applicationId).entitlements(entitlementId).delete();
	}

	async listSKUs(applicationId: string) {
		return this.client.proxy.applications(applicationId).skus.get();
	}
}
