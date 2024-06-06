import type { ExtraProps, RegisteredMiddlewares, UsingClient } from '../commands';
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

	props: ExtraProps = {};

	onAfterRun?(context: ModalContext, error: unknown | undefined): any;
	onRunError?(context: ModalContext, error: unknown): any;
	onMiddlewaresError?(context: ModalContext, error: string): any;
	onInternalError?(client: UsingClient, error?: unknown): any;
}
