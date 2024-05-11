import type { RegisteredMiddlewares, UsingClient } from '../commands';
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
}
