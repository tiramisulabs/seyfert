import type { ExtraProps, RegisteredMiddlewares, UsingClient } from '../commands';
import { InteractionCommandType } from './componentcommand';
import type { ModalContext } from './modalcontext';

export interface ModalCommand {
	__filePath?: string;
}

export abstract class ModalCommand {
	type = InteractionCommandType.MODAL;
	filter?(context: ModalContext): Promise<boolean> | boolean;
	customId?: string;
	abstract run(context: ModalContext): any;

	/** @internal */
	async _filter(context: ModalContext) {
		const old = (await this.filter?.(context)) ?? true;
		if (this.customId) return this.customId === context.customId && old;
		return old;
	}

	middlewares: (keyof RegisteredMiddlewares)[] = [];

	props!: ExtraProps;

	onAfterRun?(context: ModalContext, error: unknown | undefined): any;
	onRunError?(context: ModalContext, error: unknown): any;
	onMiddlewaresError?(context: ModalContext, error: string): any;
	onInternalError?(client: UsingClient, error?: unknown): any;
}
