import { ComponentType } from 'discord-api-types/v10';
import type { ContextComponentCommandInteractionMap, ComponentContext } from './componentcontext';
import type { PassFunction, RegisteredMiddlewares, StopFunction, UsingClient } from '../commands';

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
	/** @internal */
	static __runMiddlewares(
		context: ComponentContext,
		middlewares: (keyof RegisteredMiddlewares)[],
		global: boolean,
	): Promise<{ error?: string; pass?: boolean }> {
		if (!middlewares.length) {
			return Promise.resolve({});
		}
		let index = 0;

		return new Promise(res => {
			let running = true;
			const pass: PassFunction = () => {
				if (!running) {
					return;
				}
				running = false;
				return res({ pass: true });
			};
			function next(obj: any) {
				if (!running) {
					return;
				}
				// biome-ignore lint/style/noArguments: yes
				if (arguments.length) {
					// @ts-expect-error
					context[global ? 'globalMetadata' : 'metadata'][middlewares[index]] = obj;
				}
				if (++index >= middlewares.length) {
					running = false;
					return res({});
				}
				context.client.middlewares![middlewares[index]]({ context, next, stop, pass });
			}
			const stop: StopFunction = err => {
				if (!running) {
					return;
				}
				running = false;
				return res({ error: err });
			};
			context.client.middlewares![middlewares[0]]({ context, next, stop, pass });
		});
	}

	/** @internal */
	__runMiddlewares(context: ComponentContext) {
		return ComponentCommand.__runMiddlewares(context, this.middlewares as (keyof RegisteredMiddlewares)[], false);
	}

	/** @internal */
	__runGlobalMiddlewares(context: ComponentContext) {
		return ComponentCommand.__runMiddlewares(
			context,
			(context.client.options?.globalMiddlewares ?? []) as (keyof RegisteredMiddlewares)[],
			true,
		);
	}
}
