import type { PluginMiddlewareDenialMetadata } from '../client/plugins/types';
import type { ExtraProps, ResolvedRegisteredMiddlewares, UsingClient } from '../commands';
import { InteractionCommandType } from './componentcommand';
import { matchesCustomId } from './customId';
import type { ModalContext } from './modalcontext';

export interface ModalCommand {
	__filePath?: string;
}

export abstract class ModalCommand {
	type = InteractionCommandType.MODAL;
	filter?(context: ModalContext): Promise<boolean> | boolean;
	customId?: string | RegExp;
	abstract run(context: ModalContext): any;

	/** @internal */
	_filter(context: ModalContext) {
		if (this.customId) {
			if (!matchesCustomId(this.customId, context.customId)) return false;
		}
		if (this.filter) return this.filter(context);
		return true;
	}

	middlewares: readonly (keyof ResolvedRegisteredMiddlewares)[] = [];

	props!: ExtraProps;

	onBeforeMiddlewares?(context: ModalContext): any;
	onAfterRun?(context: ModalContext, error: unknown | undefined): any;
	onRunError?(context: ModalContext, error: unknown): any;
	onMiddlewaresError?(context: ModalContext, error: string, metadata: PluginMiddlewareDenialMetadata): any;
	onInternalError?(client: UsingClient, modal: ModalCommand, error?: unknown): any;
}
