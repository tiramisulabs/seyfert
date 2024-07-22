import type { GatewayInteractionCreateDispatchData } from '../../types';
import { BaseInteraction } from '../../structures';
import type { UsingClient } from '../../commands';

export const INTERACTION_CREATE = (self: UsingClient, data: GatewayInteractionCreateDispatchData) => {
	return BaseInteraction.from(self, data);
};
