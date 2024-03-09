import type { ComponentType } from 'discord-api-types/v10';
import type { ComponentInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from '../structures';

export const InteractionCommandType = {
	COMPONENT: 0,
	MODAL: 1,
} as const;

export interface ComponentCommand {
	__filePath?: string;
}

export abstract class ComponentCommand {
	type = InteractionCommandType.COMPONENT;
	abstract componentType: ComponentType;
	abstract filter(interaction: ComponentInteraction | StringSelectMenuInteraction): Promise<boolean> | boolean;
	abstract run(interaction: ComponentInteraction | StringSelectMenuInteraction): any;
}

export interface ModalCommand {
	__filePath?: string;
}

export abstract class ModalCommand {
	type = InteractionCommandType.MODAL;
	abstract filter(interaction: ModalSubmitInteraction): Promise<boolean> | boolean;
	abstract run(interaction: ModalSubmitInteraction): any;
}
