import { ComponentType } from 'discord-api-types/v10';
import type { ContextComponentCommandInteractionMap, ComponentContext } from './componentcontext';
import type { ExtraProps, RegisteredMiddlewares, UsingClient } from '../commands';

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

	middlewares: (keyof RegisteredMiddlewares)[] = [];

	props: ExtraProps = {};

	get cType(): number {
		return ComponentType[this.componentType];
	}

	onAfterRun?(context: ComponentContext, error: unknown | undefined): any;
	onRunError?(context: ComponentContext, error: unknown): any;
	onMiddlewaresError?(context: ComponentContext, error: string): any;
	onInternalError?(client: UsingClient, error?: unknown): any;
}
