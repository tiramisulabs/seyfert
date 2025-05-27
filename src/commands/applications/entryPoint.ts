import { type GetInternalOption, type If, type PermissionStrings, magicImport } from '../../common';
import {
	ApplicationCommandType,
	type ApplicationIntegrationType,
	type EntryPointCommandHandlerType,
	type InteractionContextType,
	type LocaleString,
} from '../../types';
import type { RegisteredMiddlewares } from '../decorators';
import type { EntryPointContext } from './entrycontext';
import type { ExtraProps, UsingClient } from './shared';

export interface EntryPointCommand {
	id: If<GetInternalOption<'CommandsId'>, string, never>;
}
export abstract class EntryPointCommand {
	middlewares: (keyof RegisteredMiddlewares)[] = [];

	__filePath?: string;
	__t?: { name: string | undefined; description: string | undefined };

	name!: string;
	type = ApplicationCommandType.PrimaryEntryPoint;
	nsfw?: boolean;
	integrationTypes: ApplicationIntegrationType[] = [];
	contexts: InteractionContextType[] = [];
	description!: string;
	botPermissions?: bigint;
	dm?: boolean;
	handler!: EntryPointCommandHandlerType;
	name_localizations?: Partial<Record<LocaleString, string>>;
	description_localizations?: Partial<Record<LocaleString, string>>;

	props: ExtraProps = {};

	toJSON() {
		return {
			handler: this.handler,
			name: this.name,
			type: this.type,
			nsfw: this.nsfw,
			default_member_permissions: null,
			guild_id: null,
			description: this.description,
			name_localizations: this.name_localizations,
			description_localizations: this.description_localizations,
			dm_permission: this.dm,
			contexts: this.contexts,
			integration_types: this.integrationTypes,
		};
	}

	async reload() {
		delete require.cache[this.__filePath!];
		const __tempCommand = await magicImport(this.__filePath!).then(x => x.default ?? x);

		Object.setPrototypeOf(this, __tempCommand.prototype);
	}

	onBeforeMiddlewares?(context: EntryPointContext): any;
	abstract run?(context: EntryPointContext): any;
	onAfterRun?(context: EntryPointContext, error: unknown | undefined): any;
	onRunError(context: EntryPointContext<never>, error: unknown): any {
		context.client.logger.fatal(`${this.name}.<onRunError>`, context.author.id, error);
	}
	onMiddlewaresError(context: EntryPointContext<never>, error: string): any {
		context.client.logger.fatal(`${this.name}.<onMiddlewaresError>`, context.author.id, error);
	}
	onBotPermissionsFail(context: EntryPointContext<never>, permissions: PermissionStrings): any {
		context.client.logger.fatal(`${this.name}.<onBotPermissionsFail>`, context.author.id, permissions);
	}
	onInternalError(client: UsingClient, command: EntryPointCommand, error?: unknown): any {
		client.logger.fatal(command.name, error);
	}
}
