import type { UsingClient } from '../../commands';
import { BaseInteraction } from '../../structures';
import type { GatewayInteractionCreateDispatchData } from '../../types';

export const INTERACTION_CREATE = (self: UsingClient, data: GatewayInteractionCreateDispatchData) => {
	return BaseInteraction.from(self, data);
};
