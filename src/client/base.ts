import { join } from 'node:path';
import { ApiHandler, Router } from '../api';
import type { Adapter } from '../cache';
import { Cache, MemoryAdapter } from '../cache';
import type {
	Command,
	CommandContext,
	ContextMenuCommand,
	ExtraProps,
	MenuCommandContext,
	RegisteredMiddlewares,
	SubCommand,
	UsingClient,
} from '../commands';
import { IgnoreCommand, type InferWithPrefix, type MiddlewareContext } from '../commands/applications/shared';
import { CommandHandler } from '../commands/handler';
import {
	ChannelShorter,
	EmojiShorter,
	GuildShorter,
	InteractionShorter,
	LogLevels,
	Logger,
	MemberShorter,
	MergeOptions,
	MessageShorter,
	ReactionShorter,
	RoleShorter,
	TemplateShorter,
	ThreadShorter,
	UsersShorter,
	WebhookShorter,
	filterSplit,
	magicImport,
	type MakeRequired,
} from '../common';

import type { LocaleString, RESTPostAPIChannelMessageJSONBody } from 'discord-api-types/rest/v10';
import type { Awaitable, DeepPartial, IntentStrings, OmitInsert, PermissionStrings, When } from '../common/types/util';
import { ComponentHandler } from '../components/handler';
import { LangsHandler } from '../langs/handler';
import type {
	ChatInputCommandInteraction,
	ComponentInteraction,
	MessageCommandInteraction,
	ModalSubmitInteraction,
	UserCommandInteraction,
} from '../structures';
import type { ComponentCommand, ComponentContext, ModalCommand, ModalContext } from '../components';
import { promises } from 'node:fs';
import { BanShorter } from '../common/shorters/bans';
import { HandleCommand } from '../commands/handle';
import type { MessageStructure } from './transformers';

export class BaseClient {
	rest!: ApiHandler;
	cache!: Cache;

	users = new UsersShorter(this);
	channels = new ChannelShorter(this);
	guilds = new GuildShorter(this);
	messages = new MessageShorter(this);
	members = new MemberShorter(this);
	webhooks = new WebhookShorter(this);
	templates = new TemplateShorter(this);
	roles = new RoleShorter(this);
	reactions = new ReactionShorter(this);
	emojis = new EmojiShorter(this);
	threads = new ThreadShorter(this);
	bans = new BanShorter(this);
	interactions = new InteractionShorter(this);

	debugger?: Logger;

	logger = new Logger({
		name: '[Seyfert]',
	});

	langs? = new LangsHandler(this.logger);
	commands? = new CommandHandler(this.logger, this);
	components? = new ComponentHandler(this.logger, this);
	handleCommand!: HandleCommand;

	private _applicationId?: string;
	private _botId?: string;
	middlewares?: Record<string, MiddlewareContext>;

	protected static assertString(value: unknown, message?: string): asserts value is string {
		if (!(typeof value === 'string' && value !== '')) {
			throw new Error(message ?? 'Value is not a string');
		}
	}

	protected static getBotIdFromToken(token: string): string {
		return Buffer.from(token.split('.')[0], 'base64').toString('ascii');
	}

	options: BaseClientOptions;

	/**@internal */
	static _seyfertConfig?: InternalRuntimeConfigHTTP | InternalRuntimeConfig;

	constructor(options?: BaseClientOptions) {
		this.options = MergeOptions(
			{
				commands: {
					defaults: {
						onRunError(context, error): any {
							context.client.logger.fatal(`${context.command.name}.<onRunError>`, context.author.id, error);
						},
						onOptionsError(context, metadata): any {
							context.client.logger.fatal(`${context.command.name}.<onOptionsError>`, context.author.id, metadata);
						},
						onMiddlewaresError(context, error: string): any {
							context.client.logger.fatal(`${context.command.name}.<onMiddlewaresError>`, context.author.id, error);
						},
						onBotPermissionsFail(context, permissions): any {
							context.client.logger.fatal(
								`${context.command.name}.<onBotPermissionsFail>`,
								context.author.id,
								permissions,
							);
						},
						onPermissionsFail(context, permissions): any {
							context.client.logger.fatal(
								`${context.command.name}.<onPermissionsFail>`,
								context.author.id,
								permissions,
							);
						},
						onInternalError(client: UsingClient, command, error?: unknown): any {
							client.logger.fatal(`${command.name}.<onInternalError>`, error);
						},
					},
				},
				components: {
					defaults: {
						onRunError(context: ComponentContext, error: unknown): any {
							context.client.logger.fatal('ComponentCommand.<onRunError>', context.author.id, error);
						},
						onMiddlewaresError(context: ComponentContext, error: string): any {
							context.client.logger.fatal('ComponentCommand.<onMiddlewaresError>', context.author.id, error);
						},
						onInternalError(client: UsingClient, error?: unknown): any {
							client.logger.fatal(error);
						},
					},
				},
				modals: {
					defaults: {
						onRunError(context: ModalContext, error: unknown): any {
							context.client.logger.fatal('ComponentCommand.<onRunError>', context.author.id, error);
						},
						onMiddlewaresError(context: ModalContext, error: string): any {
							context.client.logger.fatal('ComponentCommand.<onMiddlewaresError>', context.author.id, error);
						},
						onInternalError(client: UsingClient, error?: unknown): any {
							client.logger.fatal(error);
						},
					},
				},
			} satisfies BaseClientOptions,
			options,
		);
	}

	set botId(id: string) {
		this._botId = id;
	}

	get botId() {
		return this._botId ?? BaseClient.getBotIdFromToken(this.rest.options.token);
	}

	set applicationId(id: string) {
		this._applicationId = id;
	}

	get applicationId() {
		return this._applicationId ?? this.botId;
	}

	get proxy() {
		return new Router(this.rest).createProxy();
	}

	setServices({ rest, cache, langs, middlewares, handlers, handleCommand }: ServicesOptions) {
		if (rest) {
			this.rest = rest;
		}
		if (cache) {
			this.cache = new Cache(
				this.cache?.intents ?? 0,
				cache?.adapter ?? this.cache?.adapter ?? new MemoryAdapter(),
				cache.disabledCache ?? this.cache?.disabledCache ?? [],
				this,
			);
		}
		if (middlewares) {
			this.middlewares = middlewares;
		}
		if (handlers) {
			if ('components' in handlers) {
				if (!handlers.components) {
					this.components = undefined;
				} else if (typeof handlers.components === 'function') {
					this.components ??= new ComponentHandler(this.logger, this);
				} else {
					this.components = handlers.components;
				}
			}
			if ('commands' in handlers) {
				if (!handlers.commands) {
					this.commands = undefined;
				} else if (typeof handlers.commands === 'object') {
					this.commands ??= new CommandHandler(this.logger, this);
				} else {
					this.commands = handlers.commands;
				}
			}
			if ('langs' in handlers) {
				if (!handlers.langs) {
					this.langs = undefined;
				} else if (typeof handlers.langs === 'function') {
					this.langs ??= new LangsHandler(this.logger);
				} else {
					this.langs = handlers.langs;
				}
			}
		}
		if (langs) {
			if (langs.default) this.langs!.defaultLang = langs.default;
			if (langs.aliases) this.langs!.aliases = Object.entries(langs.aliases);
		}

		if (handleCommand) this.handleCommand = new handleCommand(this);
	}

	protected async execute(..._options: unknown[]) {
		if ((await this.getRC()).debug) {
			this.debugger = new Logger({
				name: '[Debug]',
				logLevel: LogLevels.Debug,
			});
		}
	}

	async start(
		options: Pick<DeepPartial<StartOptions>, 'langsDir' | 'commandsDir' | 'connection' | 'token' | 'componentsDir'> = {
			token: undefined,
			langsDir: undefined,
			commandsDir: undefined,
			connection: undefined,
			componentsDir: undefined,
		},
	) {
		await this.loadLangs(options.langsDir);
		await this.loadCommands(options.commandsDir);
		await this.loadComponents(options.componentsDir);

		const { token: tokenRC } = await this.getRC();
		const token = options?.token ?? tokenRC;

		if (!this.rest) {
			BaseClient.assertString(token, 'token is not a string');
			this.rest = new ApiHandler({
				token,
				baseUrl: 'api/v10',
				domain: 'https://discord.com',
				debug: (await this.getRC()).debug,
			});
		}

		if (this.cache) {
			this.cache.__setClient(this);
		} else {
			this.cache = new Cache(0, new MemoryAdapter(), [], this);
		}

		if (!this.handleCommand) this.handleCommand = new HandleCommand(this);
	}

	protected async onPacket(..._packet: unknown[]) {
		throw new Error('Function not implemented');
	}

	private shouldUploadCommands(cachePath: string, guildId?: string) {
		return this.commands!.shouldUpload(cachePath, guildId).then(should => {
			this.logger.debug(
				should
					? `[${guildId ?? 'global'}] Change(s) detected, uploading commands`
					: `[${guildId ?? 'global'}] commands seems to be up to date`,
			);
			return should;
		});
	}

	private syncCachePath(cachePath: string) {
		this.logger.debug('Syncing commands cache');
		return promises.writeFile(
			cachePath,
			JSON.stringify(
				this.commands!.values.filter(cmd => !('ignore' in cmd) || cmd.ignore !== IgnoreCommand.Slash).map(x =>
					x.toJSON(),
				),
			),
		);
	}

	async uploadCommands({ applicationId, cachePath }: { applicationId?: string; cachePath?: string } = {}) {
		applicationId ??= await this.getRC().then(x => x.applicationId ?? this.applicationId);
		BaseClient.assertString(applicationId, 'applicationId is not a string');

		const commands = this.commands!.values;
		const filter = filterSplit(commands, command => !command.guildId);

		if (!cachePath || (await this.shouldUploadCommands(cachePath)))
			await this.proxy.applications(applicationId).commands.put({
				body: filter.expect
					.filter(cmd => !('ignore' in cmd) || cmd.ignore !== IgnoreCommand.Slash)
					.map(x => x.toJSON()),
			});

		const guilds = new Set<string>();

		for (const command of filter.never) {
			for (const guild_id of command.guildId!) {
				guilds.add(guild_id);
			}
		}

		for (const guildId of guilds) {
			if (!cachePath || (await this.shouldUploadCommands(cachePath, guildId))) {
				await this.proxy
					.applications(applicationId)
					.guilds(guildId)
					.commands.put({
						body: filter.never
							.filter(
								cmd => cmd.guildId?.includes(guildId) && (!('ignore' in cmd) || cmd.ignore !== IgnoreCommand.Slash),
							)
							.map(x => x.toJSON()),
					});
			}
		}

		if (cachePath) await this.syncCachePath(cachePath);
	}

	async loadCommands(dir?: string) {
		dir ??= await this.getRC().then(x => x.commands);
		if (dir && this.commands) {
			await this.commands.load(dir, this);
			this.logger.info('CommandHandler loaded');
		}
	}

	async loadComponents(dir?: string) {
		dir ??= await this.getRC().then(x => x.components);
		if (dir && this.components) {
			await this.components.load(dir);
			this.logger.info('ComponentHandler loaded');
		}
	}

	async loadLangs(dir?: string) {
		dir ??= await this.getRC().then(x => x.langs);
		if (dir && this.langs) {
			await this.langs.load(dir);
			this.logger.info('LangsHandler loaded');
		}
	}

	t(locale: string) {
		return this.langs!.get(locale);
	}

	async getRC<
		T extends InternalRuntimeConfigHTTP | InternalRuntimeConfig = InternalRuntimeConfigHTTP | InternalRuntimeConfig,
	>() {
		const seyfertConfig = (BaseClient._seyfertConfig ||
			(await this.options?.getRC?.()) ||
			(await Promise.any(
				['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts'].map(ext =>
					magicImport(join(process.cwd(), `seyfert.config${ext}`)).then(x => x.default ?? x),
				),
			))) as T;

		const { locations, debug, ...env } = seyfertConfig;

		const obj = {
			debug: !!debug,
			...env,
			templates: locations.templates ? join(process.cwd(), locations.base, locations.templates) : undefined,
			langs: locations.langs ? join(process.cwd(), locations.output, locations.langs) : undefined,
			events:
				'events' in locations && locations.events ? join(process.cwd(), locations.output, locations.events) : undefined,
			components: locations.components ? join(process.cwd(), locations.output, locations.components) : undefined,
			commands: locations.commands ? join(process.cwd(), locations.output, locations.commands) : undefined,
			base: join(process.cwd(), locations.base),
			output: join(process.cwd(), locations.output),
		};

		BaseClient._seyfertConfig = seyfertConfig;

		return obj;
	}
}

export interface BaseClientOptions {
	context?: (
		interaction:
			| ChatInputCommandInteraction<boolean>
			| UserCommandInteraction<boolean>
			| MessageCommandInteraction<boolean>
			| ComponentInteraction
			| ModalSubmitInteraction
			| When<InferWithPrefix, MessageStructure, never>,
	) => {};
	globalMiddlewares?: readonly (keyof RegisteredMiddlewares)[];
	commands?: {
		defaults?: {
			onRunError?: (context: MenuCommandContext<any, never> | CommandContext, error: unknown) => unknown;
			onPermissionsFail?: Command['onPermissionsFail'];
			onBotPermissionsFail?: (
				context: MenuCommandContext<any, never> | CommandContext,
				permissions: PermissionStrings,
			) => unknown;
			onInternalError?: (
				client: UsingClient,
				command: Command | SubCommand | ContextMenuCommand,
				error?: unknown,
			) => unknown;
			onMiddlewaresError?: (context: CommandContext | MenuCommandContext<any, never>, error: string) => unknown;
			onOptionsError?: Command['onOptionsError'];
			onAfterRun?: (context: CommandContext | MenuCommandContext<any, never>, error: unknown) => unknown;
			props?: ExtraProps;
		};
	};
	components?: {
		defaults?: {
			onRunError?: ComponentCommand['onRunError'];
			onInternalError?: ComponentCommand['onInternalError'];
			onMiddlewaresError?: ComponentCommand['onMiddlewaresError'];
			onAfterRun?: ComponentCommand['onAfterRun'];
		};
	};
	modals?: {
		defaults?: {
			onRunError?: ModalCommand['onRunError'];
			onInternalError?: ModalCommand['onInternalError'];
			onMiddlewaresError?: ModalCommand['onMiddlewaresError'];
			onAfterRun?: ModalCommand['onAfterRun'];
		};
	};
	allowedMentions?: Omit<NonNullable<RESTPostAPIChannelMessageJSONBody['allowed_mentions']>, 'parse'> & {
		parse?: ('everyone' | 'roles' | 'users')[]; //nice types, d-api
	};
	getRC?(): Awaitable<InternalRuntimeConfig | InternalRuntimeConfigHTTP>;
}

export interface StartOptions {
	eventsDir: string;
	langsDir: string;
	commandsDir: string;
	componentsDir: string;
	connection: { intents: number };
	httpConnection: {
		publicKey: string;
		port: number;
		useUWS: boolean;
	};
	token: string;
}

interface RC extends Variables {
	debug?: boolean;
	locations: {
		base: string;
		output: string;
		commands?: string;
		langs?: string;
		templates?: string;
		events?: string;
		components?: string;
	};
}

export interface Variables {
	token: string;
	intents?: number;
	applicationId?: string;
	port?: number;
	publicKey?: string;
}

export type InternalRuntimeConfigHTTP = Omit<
	MakeRequired<RC, 'publicKey' | 'port' | 'applicationId'>,
	'intents' | 'locations'
> & { locations: Omit<RC['locations'], 'events'> };
export type RuntimeConfigHTTP = Omit<MakeRequired<RC, 'publicKey' | 'applicationId'>, 'intents' | 'locations'> & {
	locations: Omit<RC['locations'], 'events'>;
};

export type InternalRuntimeConfig = Omit<MakeRequired<RC, 'intents'>, 'publicKey' | 'port'>;
export type RuntimeConfig = OmitInsert<
	InternalRuntimeConfig,
	'intents',
	{ intents?: IntentStrings | number[] | number }
>;

export interface ServicesOptions {
	rest?: ApiHandler;
	cache?: { adapter?: Adapter; disabledCache?: Cache['disabledCache'] };
	langs?: {
		default?: string;
		aliases?: Record<string, LocaleString[]>;
	};
	middlewares?: Record<string, MiddlewareContext>;
	handlers?: {
		components?: ComponentHandler | ComponentHandler['callback'];
		commands?: CommandHandler;
		langs?: LangsHandler;
	};
	handleCommand?: typeof HandleCommand;
}
