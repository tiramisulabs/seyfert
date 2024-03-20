import { join } from 'node:path';
import { ApiHandler, Router } from '../api';
import type { Adapter } from '../cache';
import { Cache, MemoryAdapter } from '../cache';
import type { RegisteredMiddlewares } from '../commands';
import type { InferWithPrefix, MiddlewareContext } from '../commands/applications/shared';
import { CommandHandler } from '../commands/handler';
import {
	ChannelShorter,
	EmojiShorter,
	GuildShorter,
	LogLevels,
	Logger,
	MemberShorter,
	MessageShorter,
	ReactionShorter,
	RoleShorter,
	TemplateShorter,
	UsersShorter,
	WebhookShorter,
	filterSplit,
	magicImport,
	type LocaleString,
	type MakeRequired,
} from '../common';

import type { DeepPartial, IntentStrings, OmitInsert, When } from '../common/types/util';
import { ComponentHandler } from '../components/handler';
import { LangsHandler } from '../langs/handler';
import type {
	ChatInputCommandInteraction,
	Message,
	MessageCommandInteraction,
	UserCommandInteraction,
} from '../structures';

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

	debugger?: Logger;

	logger = new Logger({
		name: '[Seyfert]',
	});

	langs = new LangsHandler(this.logger);
	commands = new CommandHandler(this.logger, this);
	components = new ComponentHandler(this.logger, this);

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

	options: BaseClientOptions | undefined;

	constructor(options?: BaseClientOptions) {
		this.options = options;
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

	setServices({ rest, cache, langs, middlewares }: ServicesOptions) {
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
		if (langs) {
			if (langs.default) this.langs.defaultLang = langs.default;
			if (langs.aliases) this.langs.aliases = Object.entries(langs.aliases);
		}
		if (middlewares) {
			this.middlewares = middlewares;
		}
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

		if (!this.cache) {
			this.cache = new Cache(0, new MemoryAdapter(), [], this);
		} else {
			this.cache.__setClient(this);
		}
	}

	protected async onPacket(..._packet: unknown[]) {
		throw new Error('Function not implemented');
	}

	async uploadCommands(applicationId?: string) {
		applicationId ??= await this.getRC().then(x => x.applicationId ?? this.applicationId);
		BaseClient.assertString(applicationId, 'applicationId is not a string');

		const commands = this.commands.values.map(x => x.toJSON());
		const filter = filterSplit(commands, command => !command.guild_id);

		await this.proxy.applications(applicationId).commands.put({
			body: filter.expect,
		});

		const guilds = new Set<string>();

		for (const command of filter.never) {
			for (const guild_id of command.guild_id!) {
				guilds.add(guild_id);
			}
		}

		for (const guild of guilds) {
			await this.proxy
				.applications(applicationId)
				.guilds(guild)
				.commands.put({
					body: filter.never.filter(x => x.guild_id?.includes(guild)),
				});
		}
	}

	async loadCommands(dir?: string) {
		dir ??= await this.getRC().then(x => x.commands);
		if (dir) {
			await this.commands.load(dir, this);
			this.logger.info('CommandHandler loaded');
		}
	}

	async loadComponents(dir?: string) {
		dir ??= await this.getRC().then(x => x.components);
		if (dir) {
			await this.components.load(dir);
			this.logger.info('ComponentHandler loaded');
		}
	}

	async loadLangs(dir?: string) {
		dir ??= await this.getRC().then(x => x.langs);
		if (dir) {
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
		const { locations, debug, ...env } = (await magicImport(join(process.cwd(), 'seyfert.config.js')).then(
			x => x.default ?? x,
		)) as T;

		return {
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
	}
}

export interface BaseClientOptions {
	context?: (
		interaction:
			| ChatInputCommandInteraction<boolean>
			| UserCommandInteraction<boolean>
			| MessageCommandInteraction<boolean>
			| When<InferWithPrefix, Message, never>,
	) => {};
	globalMiddlewares?: readonly (keyof RegisteredMiddlewares)[];
}

export interface StartOptions {
	eventsDir: string;
	langsDir: string;
	commandsDir: string;
	componentsDir: string;
	connection: { intents: number };
	httpConnection: { publicKey: string; port: number };
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
export type RuntimeConfig = OmitInsert<InternalRuntimeConfig, 'intents', { intents?: IntentStrings | number }>;

export interface ServicesOptions {
	rest?: ApiHandler;
	cache?: { adapter?: Adapter; disabledCache?: Cache['disabledCache'] };
	langs?: {
		default?: string;
		aliases?: Record<string, LocaleString[]>;
	};
	middlewares?: Record<string, MiddlewareContext>;
}
