import type { GatewayInteractionCreateDispatchData } from 'discord-api-types/v10';
import { BaseInteraction } from '../../structures';
import type { UsingClient } from '../../commands';

export const INTERACTION_CREATE = (self: UsingClient, data: GatewayInteractionCreateDispatchData) => {
	return BaseInteraction.from(self, data);
};
