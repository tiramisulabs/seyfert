import { promises } from 'node:fs';
import { join } from 'node:path';
import { ApiHandler } from '../api';
import { isBufferLike } from '../api/utils/utils';
import type { Adapter, DisabledCache } from '../cache';
import { Cache, MemoryAdapter } from '../cache';
import type {
	Command,
	CommandContext,
	ContextMenuCommand,
	EntryPointCommand,
	ExtendedRC,
	ExtendedRCLocations,
	ExtraProps,
	MenuCommandContext,
	RegisteredMiddlewares,
	SubCommand,
	UsingClient,
} from '../commands';
import { IgnoreCommand, type InferWithPrefix, type MiddlewareContext } from '../commands/applications/shared';
import { HandleCommand } from '../commands/handle';
import { CommandHandler } from '../commands/handler';
import {
	ApplicationShorter,
	assertString,
	ChannelShorter,
	EmojiShorter,
	filterSplit,
	GuildShorter,
	InteractionShorter,
	InvitesShorter,
	Logger,
	LogLevels,
	type MakeRequired,
	MemberShorter,
	MergeOptions,
	MessageShorter,
	magicImport,
	ReactionShorter,
	RoleShorter,
	SeyfertError,
	TemplateShorter,
	ThreadShorter,
	UsersShorter,
	WebhookShorter,
} from '../common';
import { toArrayBuffer } from '../common/it/utils';
import { BanShorter } from '../common/shorters/bans';
import { SoundboardShorter } from '../common/shorters/soundboard';
import { VoiceStateShorter } from '../common/shorters/voiceStates';
import type { Awaitable, DeepPartial, IntentStrings, OmitInsert, PermissionStrings, When } from '../common/types/util';
import type { ComponentCommand, ComponentContext, ModalCommand, ModalContext } from '../components';
import { ComponentHandler } from '../components/handler';
import { LangsHandler } from '../langs/handler';
import type {
	ChatInputCommandInteraction,
	ComponentInteraction,
	EntryPointInteraction,
	MessageCommandInteraction,
	ModalSubmitInteraction,
	UserCommandInteraction,
} from '../structures';
import type { APIInteraction, APIInteractionResponse, LocaleString, RESTPostAPIChannelMessageJSONBody } from '../types';
import type { MessageStructure } from './transformers';

export class BaseClient {
	rest = new ApiHandler({ token: 'INVALID' });
	cache = new Cache(0, new MemoryAdapter(), {}, this);

	applications = new ApplicationShorter(this);
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
	voiceStates = new VoiceStateShorter(this);
	soundboards = new SoundboardShorter(this);
	invites = new InvitesShorter(this);

	debugger?: Logger;

	logger = new Logger({
		name: '[Seyfert]',
	});

	langs = new LangsHandler(this.logger);
	commands = new CommandHandler(this.logger, this);
	components = new ComponentHandler(this.logger, this);
	handleCommand!: HandleCommand;

	private _applicationId?: string;
	private _botId?: string;
	middlewares?: Record<string, MiddlewareContext>;

	protected static getBotIdFromToken(token: string): string {
		return Buffer.from(token.split('.')[0], 'base64').toString('ascii');
	}

	options: BaseClientOptions;

	/**@internal */
	static _seyfertCfWorkerConfig?: InternalRuntimeConfigHTTP | InternalRuntimeConfig;

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
						onInternalError(client: UsingClient, command, error: unknown): any {
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
						onInternalError(client: UsingClient, error: unknown): any {
							client.logger.fatal(error);
						},
					},
				},
				modals: {
					defaults: {
						onRunError(context: ModalContext, error: unknown): any {
							context.client.logger.fatal('ModalCommand.<onRunError>', context.author.id, error);
						},
						onMiddlewaresError(context: ModalContext, error: string): any {
							context.client.logger.fatal('ModalCommand.<onMiddlewaresError>', context.author.id, error);
						},
						onInternalError(client: UsingClient, error: unknown): any {
							client.logger.fatal(error);
						},
					},
				},
			} satisfies BaseClientOptions,
			options,
		);
	}

	get proxy() {
		return this.rest.proxy;
	}

	set botId(id: string) {
		this._botId = id;
	}

	get botId(): string {
		return this._botId ?? BaseClient.getBotIdFromToken(this.rest.options.token) ?? '';
	}

	set applicationId(id: string) {
		this._applicationId = id;
	}

	get applicationId(): string {
		return this._applicationId ?? this.botId;
	}

	setServices({ rest, cache, langs, middlewares, handleCommand }: ServicesOptions) {
		if (rest) {
			rest.onRatelimit ??= this.rest.onRatelimit?.bind(rest);
			this.rest = rest;
		}
		if (cache) {
			const caches: (keyof DisabledCache)[] = [
				'bans',
				'channels',
				'emojis',
				'guilds',
				'members',
				'messages',
				'onPacket',
				'overwrites',
				'presences',
				'roles',
				'stageInstances',
				'stickers',
				'users',
				'voiceStates',
			];
			let disabledCache: Partial<Record<keyof DisabledCache, boolean>> = {};

			if (typeof cache.disabledCache === 'boolean') {
				for (const i of caches) {
					disabledCache[i] = cache.disabledCache;
				}
			} else if (typeof cache.disabledCache === 'function') {
				for (const i of caches) {
					disabledCache[i] = cache.disabledCache(i);
				}
			} else if (typeof cache.disabledCache === 'object') {
				disabledCache = cache.disabledCache;
			}

			if (cache.adapter) this.cache.adapter = cache.adapter;
			if (cache.disabledCache) this.cache.buildCache(disabledCache, this);
		}
		if (middlewares) {
			this.middlewares = middlewares;
		}
		if (langs) {
			this.langs ??= new LangsHandler(this.logger);
			if (langs.default) this.langs.defaultLang = langs.default;
			if (langs.aliases) this.langs.aliases = Object.entries(langs.aliases);
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
		options: Pick<
			DeepPartial<StartOptions>,
			'langsDir' | 'commandsDir' | 'connection' | 'token' | 'componentsDir'
		> = {},
	) {
		await this.loadLangs(options.langsDir);
		await this.loadCommands(options.commandsDir);
		await this.loadComponents(options.componentsDir);

		const { token: tokenRC, debug } = await this.getRC();
		const token = options.token ?? tokenRC;
		assertString(token, 'token is not a string');

		if (this.rest.options.token === 'INVALID') this.rest.options.token = token;
		this.rest.debug = debug;

		if (!this.handleCommand) this.handleCommand = new HandleCommand(this);

		// The reason of this method is so for adapters that need to connect somewhere, have time to connect.
		// Or maybe clear cache?
		await this.cache.adapter.start();
	}

	protected async onPacket(..._packet: unknown[]): Promise<any> {
		throw new SeyfertError('FUNCTION_NOT_IMPLEMENTED', { metadata: { detail: 'Function not implemented' } });
	}

	/**
	 *
	 * @param rawBody body of interaction
	 * @returns
	 */
	async onInteractionRequest(rawBody: APIInteraction): Promise<{
		headers: { 'Content-Type'?: string };
		response: APIInteractionResponse | FormData;
	}> {
		return new Promise(async r => {
			await this.handleCommand.interaction(rawBody, -1, async ({ body, files }) => {
				let response: FormData | APIInteractionResponse;
				const headers: { 'Content-Type'?: string } = {};

				if (files) {
					response = new FormData();
					for (const [index, file] of files.entries()) {
						const fileKey = file.key ?? `files[${index}]`;
						if (isBufferLike(file.data)) {
							let data: Exclude<typeof file.data, Uint8Array | Uint8ClampedArray>;
							if (
								Buffer.isBuffer(file.data) ||
								file.data instanceof Uint8Array ||
								file.data instanceof Uint8ClampedArray
							) {
								data = toArrayBuffer(file.data);
							} else {
								data = file.data;
							}
							response.append(fileKey, new Blob([data], { type: file.contentType }), file.filename);
						} else {
							response.append(fileKey, new Blob([`${file.data}`], { type: file.contentType }), file.filename);
						}
					}
					if (body) {
						response.append('payload_json', JSON.stringify(body));
					}
				} else {
					response = body ?? {};
					headers['Content-Type'] = 'application/json';
				}

				return r({
					headers,
					response,
				});
			});
		});
	}

	private async shouldUploadCommands(cachePath: string, guildId?: string) {
		const should = await this.commands.shouldUpload(cachePath, guildId);
		this.logger.debug(
			should
				? `[${guildId ?? 'global'}] Change(s) detected, uploading commands`
				: `[${guildId ?? 'global'}] commands seems to be up to date`,
		);
		return should;
	}

	private syncCachePath(cachePath: string) {
		return promises.writeFile(
			cachePath,
			JSON.stringify(
				this.commands.values
					.filter(cmd => !('ignore' in cmd) || cmd.ignore !== IgnoreCommand.Slash)
					.map(x => x.toJSON()),
			),
		);
	}

	async uploadCommands({ applicationId, cachePath }: { applicationId?: string; cachePath?: string } = {}) {
		applicationId ??= await this.getRC().then(x => x.applicationId ?? this.applicationId);
		assertString(applicationId, 'applicationId is not a string');

		const commands = this.commands.values;
		const filter = filterSplit<
			Omit<Command | ContextMenuCommand, 'guildId'> | EntryPointCommand,
			MakeRequired<Command | ContextMenuCommand, 'guildId'>
		>(commands, command => ('guildId' in command ? !((command.guildId ?? []).length > 0) : true));

		if (this.commands.entryPoint) {
			filter.expect.push(this.commands.entryPoint);
		}

		if (!cachePath || (await this.shouldUploadCommands(cachePath)))
			await this.proxy.applications(applicationId).commands.put({
				body: filter.expect
					.filter(cmd => !('ignore' in cmd) || cmd.ignore !== IgnoreCommand.Slash)
					.map(x => x.toJSON()),
			});

		const guilds = new Set<string>();

		for (const command of filter.never) {
			for (const guild_id of command.guildId) {
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
								cmd => cmd.guildId.includes(guildId) && (!('ignore' in cmd) || cmd.ignore !== IgnoreCommand.Slash),
							)
							.map(x => x.toJSON()),
					});
			}
		}

		if (cachePath) await this.syncCachePath(cachePath);
	}

	async loadCommands(dir?: string) {
		dir ??= await this.getRC().then(x => x.locations.commands);
		if (dir && this.commands) {
			await this.commands.load(dir, this);
			this.logger.info('CommandHandler loaded');
		}
	}

	async loadComponents(dir?: string) {
		dir ??= await this.getRC().then(x => x.locations.components);
		if (dir && this.components) {
			await this.components.load(dir);
			this.logger.info('ComponentHandler loaded');
		}
	}

	async loadLangs(dir?: string) {
		dir ??= await this.getRC().then(x => x.locations.langs);
		if (dir && this.langs) {
			await this.langs.load(dir);
			this.logger.info('LangsHandler loaded');
		}
	}

	t(locale: string) {
		return this.langs.get(locale);
	}

	async getRC<
		T extends InternalRuntimeConfigHTTP | InternalRuntimeConfig = InternalRuntimeConfigHTTP | InternalRuntimeConfig,
	>() {
		const seyfertConfig = (BaseClient._seyfertCfWorkerConfig ||
			(await this.options?.getRC?.()) ||
			(await Promise.any(
				['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts'].map(ext =>
					magicImport(join(process.cwd(), `seyfert.config${ext}`)).then(x => x.default ?? x),
				),
			).catch((e: AggregateError) => {
				const errors = e.errors.map((err: Error) => {
					err.message = err.message.replace(/seyfert\.config\.(js|mjs|cjs|ts|mts|cts)/g, 'seyfert.config');
					return err;
				});

				const uniqueError = errors.find(er => errors.filter(err => err.message === er.message).length === 1);
				if (uniqueError) throw uniqueError;
				throw new SeyfertError('NO_SEYFERT_CONFIG', {
					metadata: { detail: 'No seyfert.config file found' },
				});
			}))) as T;

		const { locations, debug, ...env } = seyfertConfig;

		const locationsFullPaths: RC['locations'] = {
			base: locations.base,
		};

		for (const i in locations) {
			const key = i as keyof typeof locations;
			const location = locations[key];
			if (key in locationsFullPaths) continue;
			if (typeof location === 'string') locationsFullPaths[key] = join(process.cwd(), locations.base, location);
			else locationsFullPaths[key] = location as any;
		}

		const obj = {
			debug: !!debug,
			...env,
			locations: locationsFullPaths,
		};

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
			| EntryPointInteraction<boolean>
			| When<InferWithPrefix, MessageStructure, never>,
	) => Record<string, unknown>;
	globalMiddlewares?: readonly (keyof RegisteredMiddlewares)[];
	commands?: {
		defaults?: {
			onBeforeMiddlewares?: (context: CommandContext | MenuCommandContext<any, never>) => unknown;
			onBeforeOptions?: Command['onBeforeOptions'];
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
			onBeforeMiddlewares?: ComponentCommand['onBeforeMiddlewares'];
			onRunError?: ComponentCommand['onRunError'];
			onInternalError?: ComponentCommand['onInternalError'];
			onMiddlewaresError?: ComponentCommand['onMiddlewaresError'];
			onAfterRun?: ComponentCommand['onAfterRun'];
		};
	};
	modals?: {
		defaults?: {
			onBeforeMiddlewares?: ModalCommand['onBeforeMiddlewares'];
			onRunError?: ModalCommand['onRunError'];
			onInternalError?: ModalCommand['onInternalError'];
			onMiddlewaresError?: ModalCommand['onMiddlewaresError'];
			onAfterRun?: ModalCommand['onAfterRun'];
		};
	};
	allowedMentions?: RESTPostAPIChannelMessageJSONBody['allowed_mentions'];
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
	};
	token: string;
}

interface RCLocations extends ExtendedRCLocations {
	base: string;
	commands?: string;
	langs?: string;
	events?: string;
	components?: string;
}

interface RC extends ExtendedRC {
	debug?: boolean;
	locations: RCLocations;
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

export type InternalRuntimeConfig = MakeRequired<RC, 'intents'>;
export type RuntimeConfig = OmitInsert<
	InternalRuntimeConfig,
	'intents',
	{ intents?: IntentStrings | number[] | number }
>;

export interface ServicesOptions {
	rest?: ApiHandler;
	cache?: {
		adapter?: Adapter;
		disabledCache?: boolean | DisabledCache | ((cacheType: keyof DisabledCache) => boolean);
	};
	langs?: {
		default?: string;
		aliases?: Record<string, LocaleString[]>;
	};
	middlewares?: Record<string, MiddlewareContext>;
	handleCommand?: typeof HandleCommand;
}
