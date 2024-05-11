import { ComponentType } from 'discord-api-types/v10';
import type { ContextComponentCommandInteractionMap, ComponentContext } from './componentcontext';
import type { RegisteredMiddlewares, UsingClient } from '../commands';

export const InteractionCommandType = {
	COMPONENT: 0,
	MODAL: 1,
} as const;

export interface ComponentCommand {
	__filePath?: string;
}

export abstract class ComponentCommand {
	type = InteractionCommandType.COMPONENT;
	abstract componentType: keyof ContextComponentCommandInteractionMap;
	abstract filter(context: ComponentContext<typeof this.componentType>): Promise<boolean> | boolean;
	abstract run(context: ComponentContext<typeof this.componentType>): any;

	get cType(): number {
		return ComponentType[this.componentType];
	}

	onAfterRun?(context: ComponentContext, error: unknown | undefined): any;
	onRunError(context: ComponentContext, error: unknown): any {
		context.client.logger.fatal('ComponentCommand.<onRunError>', context.author.id, error);
	}
	onMiddlewaresError(context: ComponentContext, error: string): any {
		context.client.logger.fatal('ComponentCommand.<onMiddlewaresError>', context.author.id, error);
	}
	onInternalError(client: UsingClient, error?: unknown): any {
		client.logger.fatal(error);
	}

	middlewares: (keyof RegisteredMiddlewares)[] = [];
}
