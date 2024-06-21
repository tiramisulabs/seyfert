import type {
	ApplicationCommandType,
	ApplicationIntegrationType,
	InteractionContextType,
	LocaleString,
} from 'discord-api-types/v10';
import { magicImport, type PermissionStrings } from '../../common';
import type { RegisteredMiddlewares } from '../decorators';
import type { MenuCommandContext } from './menucontext';
import type { ExtraProps, UsingClient } from './shared';

export abstract class ContextMenuCommand {
	middlewares: (keyof RegisteredMiddlewares)[] = [];

	__filePath?: string;
	__t?: { name: string | undefined; description: string | undefined };

	guildId?: string[];
	name!: string;
	type!: ApplicationCommandType.User | ApplicationCommandType.Message;
	nsfw?: boolean;
	integrationTypes: ApplicationIntegrationType[] = [];
	contexts: InteractionContextType[] = [];
	description!: string;
	defaultMemberPermissions?: bigint;
	botPermissions?: bigint;
	dm?: boolean;
	name_localizations?: Partial<Record<LocaleString, string>>;
	description_localizations?: Partial<Record<LocaleString, string>>;

	props: ExtraProps = {};

	toJSON() {
		return {
			name: this.name,
			type: this.type,
			nsfw: this.nsfw,
			description: this.description,
			name_localizations: this.name_localizations,
			description_localizations: this.description_localizations,
			guild_id: this.guildId,
			dm_permission: this.dm,
			default_member_permissions: this.defaultMemberPermissions ? this.defaultMemberPermissions.toString() : undefined,
			contexts: this.contexts,
			integration_types: this.integrationTypes,
		};
	}

	async reload() {
		delete require.cache[this.__filePath!];
		const __tempCommand = await magicImport(this.__filePath!).then(x => x.default ?? x);

		Object.setPrototypeOf(this, __tempCommand.prototype);
	}

	abstract run?(context: MenuCommandContext<any>): any;
	onAfterRun?(context: MenuCommandContext<any>, error: unknown | undefined): any;
	onRunError(context: MenuCommandContext<any, never>, error: unknown): any {
		context.client.logger.fatal(`${this.name}.<onRunError>`, context.author.id, error);
	}
	onMiddlewaresError(context: MenuCommandContext<any, never>, error: string): any {
		context.client.logger.fatal(`${this.name}.<onMiddlewaresError>`, context.author.id, error);
	}
	onBotPermissionsFail(context: MenuCommandContext<any, never>, permissions: PermissionStrings): any {
		context.client.logger.fatal(`${this.name}.<onBotPermissionsFail>`, context.author.id, permissions);
	}
	// onPermissionsFail(context: MenuCommandContext<any, never>, permissions: PermissionStrings): any {
	// 	context.client.logger.fatal(`${this.name}.<onPermissionsFail>`, context.author.id, permissions);
	// }
	onInternalError(client: UsingClient, command: ContextMenuCommand, error?: unknown): any {
		client.logger.fatal(command.name, error);
	}
}
