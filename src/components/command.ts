import { ComponentType } from 'discord-api-types/v10';
import type { ModalSubmitInteraction } from '../structures';
import type { ComponentCommandInteractionMap, ComponentContext } from './componentcontext';

export const InteractionCommandType = {
	COMPONENT: 0,
	MODAL: 1,
} as const;

export interface ComponentCommand {
	__filePath?: string;
}

export abstract class ComponentCommand {
	type = InteractionCommandType.COMPONENT;
	abstract componentType: keyof ComponentCommandInteractionMap;
	abstract filter(interaction: ComponentContext<typeof this.componentType>): Promise<boolean> | boolean;
	abstract run(interaction: ComponentContext<typeof this.componentType>): any;

	get cType(): number {
		return ComponentType[this.componentType];
	}
}

export interface ModalCommand {
	__filePath?: string;
}

export abstract class ModalCommand {
	type = InteractionCommandType.MODAL;
	abstract filter(interaction: ModalSubmitInteraction): Promise<boolean> | boolean;
	abstract run(interaction: ModalSubmitInteraction): any;
}
