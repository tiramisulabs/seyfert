import type { BaseClient } from '../../client/base';
import type { GatewayInteractionCreateDispatchData } from '../../common';
import { BaseInteraction } from '../../structures';

export const INTERACTION_CREATE = (self: BaseClient, data: GatewayInteractionCreateDispatchData) => {
	return BaseInteraction.from(self, data);
};
