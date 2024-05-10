import type { RegisteredMiddlewares, PassFunction, StopFunction, UsingClient } from '../commands';
import { InteractionCommandType } from './componentcommand';
import type { ModalContext } from './modalcontext';

export interface ModalCommand {
	__filePath?: string;
}

export abstract class ModalCommand {
	type = InteractionCommandType.MODAL;
	abstract filter(context: ModalContext): Promise<boolean> | boolean;
	abstract run(context: ModalContext): any;

	middlewares: (keyof RegisteredMiddlewares)[] = [];

	onAfterRun?(context: ModalContext, error: unknown | undefined): any;
	onRunError(context: ModalContext, error: unknown): any {
		context.client.logger.fatal('ComponentCommand.<onRunError>', context.author.id, error);
	}
	onMiddlewaresError(context: ModalContext, error: string): any {
		context.client.logger.fatal('ComponentCommand.<onMiddlewaresError>', context.author.id, error);
	}
	onInternalError(client: UsingClient, error?: unknown): any {
		client.logger.fatal(error);
	}

	/** @internal */
	static __runMiddlewares(
		context: ModalContext,
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
	__runMiddlewares(context: ModalContext) {
		return ModalCommand.__runMiddlewares(context, this.middlewares as (keyof RegisteredMiddlewares)[], false);
	}

	/** @internal */
	__runGlobalMiddlewares(context: ModalContext) {
		return ModalCommand.__runMiddlewares(
			context,
			(context.client.options?.globalMiddlewares ?? []) as (keyof RegisteredMiddlewares)[],
			true,
		);
	}
}
