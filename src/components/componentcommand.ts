import type { ExtraProps, RegisteredMiddlewares, UsingClient } from '../commands';
import { ComponentType } from '../types';
import type { ComponentContext, ContextComponentCommandInteractionMap } from './componentcontext';

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
	customId?: string;
	filter?(context: ComponentContext<typeof this.componentType>): Promise<boolean> | boolean;
	abstract run(context: ComponentContext<typeof this.componentType>): any;

	/** @internal */
	_filter(context: ComponentContext) {
		if (this.customId && this.customId !== context.customId) return false;
		if (this.filter) return this.filter(context);
		return true;
	}

	middlewares: (keyof RegisteredMiddlewares)[] = [];

	props!: ExtraProps;

	get cType(): number {
		return ComponentType[this.componentType];
	}

	onAfterRun?(context: ComponentContext, error: unknown | undefined): any;
	onRunError?(context: ComponentContext, error: unknown): any;
	onMiddlewaresError?(context: ComponentContext, error: string): any;
	onInternalError?(client: UsingClient, error?: unknown): any;
}
