import { promises } from 'node:fs';
import { join } from 'node:path';
import { ApiHandler, type RestObserverEntry } from '../api';
import { isBufferLike } from '../api/utils/utils';
import type { Adapter, DisabledCache } from '../cache';
import { Cache, MemoryAdapter } from '../cache';
import type {
	Command,
	CommandContext,
	ContextMenuCommand,
	EntryPointCommand,
	ExtendContext,
	ExtendedRC,
	ExtendedRCLocations,
	ExtraProps,
	MenuCommandContext,
	ResolvedRegisteredMiddlewares,
	UsingClient,
} from '../commands';
import { SubCommand } from '../commands';
import {
	type AnyMiddlewareContext,
	IgnoreCommand,
	type InferWithPrefix,
	type MiddlewareContext,
} from '../commands/applications/shared';
import type { BaseContext } from '../commands/basecontext';
import { HandleCommand } from '../commands/handle';
import { CommandHandler, type HandleableCommand, type HandleableCommandInstance } from '../commands/handler';
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
import { type ComponentCommand, type ComponentContext, ModalCommand, type ModalContext } from '../components';
import { type ComponentCommands, ComponentHandler } from '../components/handler';
import {
	CustomEventHandler,
	type CustomEventRunner,
	type CustomEventsKeys,
	type ResolveEventRunParams,
} from '../events';
import { LangsHandler } from '../langs/handler';
import type {
	ChatInputCommandInteraction,
	ComponentInteraction,
	EntryPointInteraction,
	MessageCommandInteraction,
	ModalSubmitInteraction,
	UserCommandInteraction,
} from '../structures';
import {
	type APIInteraction,
	type APIInteractionResponse,
	InteractionResponseType,
	InteractionType,
	type LocaleString,
	type RESTPostAPIChannelMessageJSONBody,
} from '../types';
import {
	type AnySeyfertPlugin,
	bindClientPlugins,
	type PluginHandlerConstructor,
	type PluginHandlerInstance,
	type PluginHandlerKind,
	type PluginLoadedMetadata,
	type PluginMiddlewareDenialMetadata,
	type PluginSharedRegistry,
	type PluginUploadCommandsMetadata,
	type ResolvedPluginList,
	refreshClientPluginGlobalMiddlewares,
	resolveClientPluginIntents,
	resolveClientPlugins,
	runPluginHooks,
	setupClientPlugins,
	teardownClientPlugins,
} from './plugins';
import { createPluginConflictError, wrapPluginError } from './plugins/errors';
import { orderedPluginContributions } from './plugins/order';
import {
	assertCanMutatePluginContribution,
	installPluginMiddlewares,
	type PluginComponentContribution,
	type PluginModalContribution,
	type PluginRuntimeRecord,
	type PluginRuntimeRegistry,
	recordContributionMutationDiagnostic,
} from './plugins/registry';
import { createSharedRegistry } from './plugins/shared';
import type { MessageStructure } from './transformers';

export type ContextScopeContext = BaseContext & ExtendContext;
export type ContextScope = <T>(context: ContextScopeContext, run: () => Awaitable<T>) => Awaitable<T>;

const pluginSourceKey = '__seyfertPluginSource';
type PluginSourced = {
	[pluginSourceKey]?: string;
};
type ResolvedMiddlewareKey<T extends Record<string, AnyMiddlewareContext>> = Extract<keyof T, string>;

export type ClientMiddlewares<T extends Record<string, AnyMiddlewareContext> = ResolvedRegisteredMiddlewares> = [
	ResolvedMiddlewareKey<T>,
] extends [never]
	? Record<string, MiddlewareContext>
	: {
			[K in ResolvedMiddlewareKey<T>]?: T[K];
		};

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
	middlewares?: ClientMiddlewares;

	protected static getBotIdFromToken(token: string): string {
		return Buffer.from(token.split('.')[0], 'base64').toString('ascii');
	}

	readonly plugins: ResolvedPluginList = [] as unknown as ResolvedPluginList;
	shared: PluginSharedRegistry;
	events: CustomEventRunner = new CustomEventHandler(this);
	/** @internal */
	readonly pluginRegistry: PluginRuntimeRegistry;
	private pluginsSetupPromise?: Promise<void>;
	private pluginsClosePromise?: Promise<void>;
	private langBaseValues: Partial<Record<string, any>> = {};
	private pluginCacheDisabledCache: DisabledCache = {};
	options: BaseClientOptions;

	/**@internal */
	static _seyfertCfWorkerConfig?: InternalRuntimeConfigHTTP | InternalRuntimeConfig;

	constructor(options?: BaseClientOptions) {
		const defaults = {
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
						context.client.logger.fatal(`${context.command.name}.<onPermissionsFail>`, context.author.id, permissions);
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
					onInternalError(client: UsingClient, component: ComponentCommand, error: unknown): any {
						client.logger.fatal(`[${component.customId ?? 'ComponentCommand'}].<onInternalError>`, error);
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
					onInternalError(client: UsingClient, modal: ModalCommand, error: unknown): any {
						client.logger.fatal(`[${modal.customId ?? 'ModalCommand'}].<onInternalError>`, error);
					},
				},
			},
		} satisfies BaseClientOptions;
		const resolved = resolveClientPlugins(defaults, options);

		this.options = resolved.options;
		this.plugins = resolved.plugins;
		this.pluginRegistry = resolved.registry;
		this.shared = createSharedRegistry(this, this.pluginRegistry);
		bindClientPlugins(this, this.pluginRegistry);
		this.bindPluginRestObserverProvider();
		this.refreshPluginCacheResources();
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
			rest.onSuccessRequest ??= this.rest.onSuccessRequest?.bind(rest);
			rest.onFailRequest ??= this.rest.onFailRequest?.bind(rest);
			this.rest = rest;
			this.bindPluginRestObserverProvider();
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
			if (cache.disabledCache) this.refreshPluginCacheResources(disabledCache);
		}
		if (middlewares) {
			this.middlewares = { ...(this.middlewares ?? {}), ...middlewares };
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
		const { token: tokenRC, debug } = await this.getRC();
		const token = options.token ?? tokenRC;
		if (typeof token !== 'string' || token.length === 0) {
			throw new SeyfertError('INVALID_TOKEN', { metadata: { detail: 'token is not a string' } });
		}

		if (this.rest.options.token === 'INVALID') this.rest.options.token = token;
		this.rest.debug = debug;

		if (!this.handleCommand) this.handleCommand = new HandleCommand(this);

		await this.setupPlugins();
		this.refreshPluginCacheResources();
		this.reloadPluginMiddlewares();
		await runPluginHooks(this, 'plugins:ready', this);

		// The reason of this method is so for adapters that need to connect somewhere, have time to connect.
		// Or maybe clear cache?
		await this.cache.adapter.start();

		await this.loadLangs(options.langsDir);
		await runPluginHooks(this, 'commands:beforeLoad', this, options.commandsDir);
		await this.loadCommands(options.commandsDir);
		await this.reloadPluginCommands();
		await this.loadComponents(options.componentsDir);
		await this.reloadPluginComponents();
	}

	async reloadPluginContributions() {
		this.refreshPluginContributions();
		const commandsMetadata = this.createPluginLoadedMetadata('commands', this.commands.values);
		await runPluginHooks(this, 'commands:afterLoad', commandsMetadata);
		await this.emitPluginCustomEvent('commandsLoaded', commandsMetadata);
		const componentsMetadata = this.createPluginLoadedMetadata('components', this.components.commands);
		await runPluginHooks(this, 'components:afterLoad', componentsMetadata);
		await this.emitPluginCustomEvent('componentsLoaded', componentsMetadata);
	}

	/** @internal */
	refreshPluginContributions() {
		this.reloadPluginMiddlewares();
		this.refreshPluginCacheResources();
		this.applyPluginLangs();
		this.applyPluginCommands();
		this.applyPluginComponents();
	}

	private bindPluginRestObserverProvider() {
		this.rest.pluginRestObserverClient = this;
		this.rest.pluginRestObserverProvider = (): readonly RestObserverEntry[] =>
			orderedPluginContributions(this.pluginRegistry.restObservers)
				.filter(contribution => contribution.active)
				.map(contribution => ({
					plugin: contribution.record.identity,
					observer: contribution.observer,
				}));
	}

	private refreshPluginCacheResources(disabledCache: DisabledCache = this.pluginCacheDisabledCache) {
		this.pluginCacheDisabledCache = disabledCache;
		this.cache.intents = resolveClientPluginIntents(this, this.cache.intents);
		this.cache.buildCache(disabledCache, this);
	}

	private reloadPluginMiddlewares() {
		installPluginMiddlewares(this, this.pluginRegistry);
		refreshClientPluginGlobalMiddlewares(this, this.pluginRegistry);
	}

	private async reloadPluginCommands() {
		this.applyPluginCommands();
		const metadata = this.createPluginLoadedMetadata('commands', this.commands.values);
		await runPluginHooks(this, 'commands:afterLoad', metadata);
		await this.emitPluginCustomEvent('commandsLoaded', metadata);
	}

	private async reloadPluginComponents() {
		this.applyPluginComponents();
		const metadata = this.createPluginLoadedMetadata('components', this.components.commands);
		await runPluginHooks(this, 'components:afterLoad', metadata);
		await this.emitPluginCustomEvent('componentsLoaded', metadata);
	}

	private async setupPlugins() {
		if (this.pluginsClosePromise) await this.pluginsClosePromise;

		this.pluginsSetupPromise ??= setupClientPlugins(this, this.plugins);

		try {
			await this.pluginsSetupPromise;
		} catch (error) {
			this.pluginsSetupPromise = undefined;
			throw error;
		}
	}

	/**
	 * Closes resources managed by the plugin lifecycle.
	 *
	 * This waits for in-flight plugin setup and runs `SeyfertPlugin.teardown`.
	 * It does not close the gateway, REST client, or cache adapter.
	 */
	async close() {
		const setup = this.pluginsSetupPromise;
		if (!setup) return;

		const close =
			this.pluginsClosePromise ??
			(async () => {
				await setup;
				await runPluginHooks(this, 'client:close', this);
				await teardownClientPlugins(this, this.plugins);
			})();
		this.pluginsClosePromise = close;

		try {
			await close;
		} finally {
			if (this.pluginsClosePromise === close) {
				this.pluginsSetupPromise = undefined;
				this.pluginsClosePromise = undefined;
			}
		}
	}

	private applyPluginCommands() {
		const contributions = this.pluginRegistry.commands;
		const removals = this.pluginRegistry.commandRemovals;
		const hasPluginCommands =
			this.commands.values.some(command => pluginSourceKey in command) ||
			!!(this.commands.entryPoint && pluginSourceKey in this.commands.entryPoint);
		if (!(contributions.length || removals.length || hasPluginCommands)) return;

		this.commands.values = this.commands.values.filter(command => !(pluginSourceKey in command));
		if (this.commands.entryPoint && pluginSourceKey in this.commands.entryPoint) this.commands.entryPoint = null;

		const existingCommands = new Map<
			string,
			{ command: Command | ContextMenuCommand | EntryPointCommand; owner?: PluginRuntimeRecord }
		>();
		for (const command of this.commands.values) existingCommands.set(command.name, { command });
		if (this.commands.entryPoint)
			existingCommands.set(this.commands.entryPoint.name, { command: this.commands.entryPoint });
		const sourceByName = new Map<string, string>();

		const mutations = orderedPluginContributions([
			...contributions.map(contribution => ({ ...contribution, kind: 'add' as const })),
			...removals.map(contribution => ({ ...contribution, kind: 'remove' as const })),
		]);

		for (const mutation of mutations) {
			if (mutation.kind === 'remove') {
				for (const name of mutation.names) {
					const existing = existingCommands.get(name);
					if (!existing) continue;
					assertCanMutatePluginContribution(
						this.pluginRegistry,
						mutation.record,
						'remove',
						'command',
						name,
						existing.owner,
						'commands.remove',
					);
					existingCommands.delete(name);
					recordContributionMutationDiagnostic(
						this.pluginRegistry,
						mutation,
						'remove',
						'command',
						name,
						existing.owner,
						'commands.remove',
					);
				}
				continue;
			}

			for (const command of mutation.commands) {
				const instance = this.createPluginCommandInstance(command, mutation.record, 'commands.add');
				if (instance instanceof SubCommand) {
					throw createPluginConflictError(
						mutation.record.plugin.name,
						'commands.add',
						mutation.record.index,
						`SubCommand "${instance.name}" cannot be registered as a top-level plugin command.`,
						mutation.record.plugin.instanceId,
					);
				}
				if (!instance.name) {
					throw createPluginConflictError(
						mutation.record.plugin.name,
						'commands.add',
						mutation.record.index,
						'Plugin command is missing a name.',
						mutation.record.plugin.instanceId,
					);
				}
				if (mutation.guilds?.length && 'guildId' in instance) {
					instance.guildId = [...mutation.guilds];
				}
				const existing = existingCommands.get(instance.name);
				if (existing && !mutation.override) {
					throw createPluginConflictError(
						mutation.record.plugin.name,
						'commands.add',
						mutation.record.index,
						`Command "${instance.name}" is already registered.`,
						mutation.record.plugin.instanceId,
					);
				}
				if (existing) {
					assertCanMutatePluginContribution(
						this.pluginRegistry,
						mutation.record,
						'override',
						'command',
						instance.name,
						existing.owner,
						'commands.add',
					);
					recordContributionMutationDiagnostic(
						this.pluginRegistry,
						mutation,
						'override',
						'command',
						instance.name,
						existing.owner,
						'commands.add',
					);
				}
				sourceByName.set(instance.name, mutation.record.identity);
				existingCommands.set(instance.name, { command: instance, owner: mutation.record });
			}
		}

		const commands = [...existingCommands.values()]
			.filter(entry => !!entry.owner)
			.map(entry => entry.command as InstanceType<HandleableCommand>);
		for (const command of this.commands.set(commands, command =>
			this.runPluginHandlerTransformers('command', command),
		)) {
			(command as PluginSourced)[pluginSourceKey] = sourceByName.get(command.name);
		}
	}

	private applyPluginComponents() {
		const contributions = this.pluginRegistry.components;
		const modalContributions = this.pluginRegistry.modals;
		const removals = this.pluginRegistry.componentRemovals;
		const modalRemovals = this.pluginRegistry.modalRemovals;
		const hasPluginComponents = this.components.commands.some(command => pluginSourceKey in command);
		if (
			!(
				contributions.length ||
				modalContributions.length ||
				removals.length ||
				modalRemovals.length ||
				hasPluginComponents
			)
		) {
			return;
		}

		const existing = this.components.commands.filter(command => !(pluginSourceKey in command));
		this.components.commands.splice(0, this.components.commands.length, ...existing);

		const componentsByCustomId = new Map<string, { component: ComponentCommands; owner?: PluginRuntimeRecord }>();
		for (const component of this.components.commands) {
			if (typeof component.customId === 'string') componentsByCustomId.set(component.customId, { component });
		}
		const dynamicComponents: { component: ComponentCommands; owner: PluginRuntimeRecord }[] = [];
		const sourceByCustomId = new Map<string, string>();

		const mutations = orderedPluginContributions([
			...contributions.map(contribution => ({
				...contribution,
				kind: 'add' as const,
				contributionKind: 'component' as const,
			})),
			...modalContributions.map(contribution => ({
				...contribution,
				kind: 'add' as const,
				contributionKind: 'modal' as const,
			})),
			...removals.map(contribution => ({
				...contribution,
				kind: 'remove' as const,
				contributionKind: 'component' as const,
			})),
			...modalRemovals.map(contribution => ({
				...contribution,
				kind: 'remove' as const,
				contributionKind: 'modal' as const,
			})),
		]);

		for (const mutation of mutations) {
			if (mutation.kind === 'remove') {
				for (const customId of mutation.customIds) {
					const existing = componentsByCustomId.get(customId);
					if (!existing) continue;
					assertCanMutatePluginContribution(
						this.pluginRegistry,
						mutation.record,
						'remove',
						mutation.contributionKind,
						customId,
						existing.owner,
						`${mutation.contributionKind}s.remove`,
					);
					componentsByCustomId.delete(customId);
					recordContributionMutationDiagnostic(
						this.pluginRegistry,
						mutation,
						'remove',
						mutation.contributionKind,
						customId,
						existing.owner,
						`${mutation.contributionKind}s.remove`,
					);
				}
				continue;
			}

			const constructors =
				mutation.contributionKind === 'component'
					? (mutation as PluginComponentContribution & { contributionKind: 'component' }).components
					: (mutation as PluginModalContribution & { contributionKind: 'modal' }).modals;
			for (const constructor of constructors) {
				const instance = this.createPluginComponentInstance(
					constructor,
					mutation.record,
					`${mutation.contributionKind}s.add`,
					mutation.contributionKind,
				);
				(instance as PluginSourced)[pluginSourceKey] = mutation.record.identity;

				if (typeof instance.customId !== 'string') {
					dynamicComponents.push({ component: instance, owner: mutation.record });
					continue;
				}
				const existing = componentsByCustomId.get(instance.customId);
				if (existing && !mutation.override) {
					throw createPluginConflictError(
						mutation.record.plugin.name,
						`${mutation.contributionKind}s.add`,
						mutation.record.index,
						`Component or modal "${instance.customId}" is already registered.`,
						mutation.record.plugin.instanceId,
					);
				}
				if (existing) {
					assertCanMutatePluginContribution(
						this.pluginRegistry,
						mutation.record,
						'override',
						mutation.contributionKind,
						instance.customId,
						existing.owner,
						`${mutation.contributionKind}s.add`,
					);
					recordContributionMutationDiagnostic(
						this.pluginRegistry,
						mutation,
						'override',
						mutation.contributionKind,
						instance.customId,
						existing.owner,
						`${mutation.contributionKind}s.add`,
					);
				}
				sourceByCustomId.set(instance.customId, mutation.record.identity);
				componentsByCustomId.set(instance.customId, { component: instance, owner: mutation.record });
			}
		}

		const components = [...componentsByCustomId.values(), ...dynamicComponents]
			.filter((entry): entry is { component: ComponentCommands; owner: PluginRuntimeRecord } => !!entry.owner)
			.map(entry => entry.component);
		for (const component of this.components.set(components, component =>
			this.runPluginHandlerTransformers(component instanceof ModalCommand ? 'modal' : 'component', component),
		)) {
			const source =
				typeof component.customId === 'string'
					? sourceByCustomId.get(component.customId)
					: (component as PluginSourced)[pluginSourceKey];
			if (source) (component as PluginSourced)[pluginSourceKey] = source;
		}
	}

	private createPluginCommandInstance(
		command: HandleableCommand | HandleableCommandInstance,
		record: PluginRuntimeRecord,
		phase: string,
	) {
		if (typeof command !== 'function') return command;
		return this.runPluginHandlerCreators('command', command, () => {
			try {
				return new command();
			} catch (error) {
				throw wrapPluginError(record.plugin.name, phase, record.index, error, undefined, record.plugin.instanceId);
			}
		});
	}

	private createPluginComponentInstance(
		constructor: (new () => ComponentCommands) | ComponentCommands,
		record: PluginRuntimeRecord,
		phase: string,
		kind: PluginHandlerKind,
	) {
		if (typeof constructor !== 'function') return constructor;
		return this.runPluginHandlerCreators(kind, constructor as PluginHandlerConstructor, () => {
			try {
				return new constructor() as InstanceType<PluginHandlerConstructor>;
			} catch (error) {
				throw wrapPluginError(record.plugin.name, phase, record.index, error, undefined, record.plugin.instanceId);
			}
		}) as ComponentCommands;
	}

	private runPluginHandlerCreators<T extends PluginHandlerConstructor>(
		kind: PluginHandlerKind,
		constructor: T,
		create: () => InstanceType<T>,
	): InstanceType<T> {
		const creators = orderedPluginContributions(this.pluginRegistry.handlerCreators).filter(contribution =>
			this.matchesPluginHandlerKind(contribution.kinds, kind),
		);
		const metadata = { kind };
		return creators.reduceRight(
			(next, contribution) => () => {
				try {
					return contribution.creator(constructor, next, metadata);
				} catch (error) {
					throw wrapPluginError(
						contribution.record.plugin.name,
						`handlers.create:${kind}`,
						contribution.record.index,
						error,
						undefined,
						contribution.record.plugin.instanceId,
					);
				}
			},
			create,
		)();
	}

	private runPluginHandlerTransformers<T extends PluginHandlerInstance>(kind: PluginHandlerKind, instance: T): T {
		let current = instance;
		const metadata = { kind };
		for (const contribution of orderedPluginContributions(this.pluginRegistry.handlerTransformers)) {
			if (!this.matchesPluginHandlerKind(contribution.kinds, kind)) continue;
			try {
				current = (contribution.transformer(current, metadata) ?? current) as T;
			} catch (error) {
				throw wrapPluginError(
					contribution.record.plugin.name,
					`handlers.transform:${kind}`,
					contribution.record.index,
					error,
					undefined,
					contribution.record.plugin.instanceId,
				);
			}
		}
		return current;
	}

	private matchesPluginHandlerKind(kinds: readonly PluginHandlerKind[] | undefined, kind: PluginHandlerKind) {
		return !kinds?.length || kinds.includes(kind);
	}

	private createPluginLoadedMetadata<TKind extends 'commands' | 'components', TItem>(
		kind: TKind,
		items: readonly TItem[],
	): PluginLoadedMetadata<TKind, TItem> {
		const sources: Record<string, number> = {};
		for (const item of items) {
			const source = (item as PluginSourced)[pluginSourceKey];
			if (source) sources[source] = (sources[source] ?? 0) + 1;
		}
		return {
			kind,
			total: items.length,
			items,
			plugin: {
				total: Object.values(sources).reduce((sum, value) => sum + value, 0),
				sources,
			},
		};
	}

	private async emitPluginCustomEvent<T extends CustomEventsKeys>(name: T, ...args: ResolveEventRunParams<T>) {
		await this.events?.runCustom(name, ...args);
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
		if (rawBody.type === InteractionType.Ping) {
			return {
				headers: { 'Content-Type': 'application/json' },
				response: { type: InteractionResponseType.Pong },
			};
		}

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

		const globalCommands = filter.expect
			.filter(cmd => !('ignore' in cmd) || cmd.ignore !== IgnoreCommand.Slash)
			.map(x => x.toJSON());
		const shouldUploadGlobal = !cachePath || (await this.shouldUploadCommands(cachePath));
		if (shouldUploadGlobal) {
			await this.proxy.applications(applicationId).commands.put({
				body: globalCommands,
			});
		}
		await this.emitUploadCommandsMetadata({
			applicationId,
			cachePath,
			commands: globalCommands.length,
			reason: cachePath ? (shouldUploadGlobal ? 'cache-miss' : 'cache-hit') : 'forced',
			scope: 'global',
			status: shouldUploadGlobal ? 'uploaded' : 'skipped',
		});

		const guilds = new Set<string>();

		for (const command of filter.never) {
			for (const guild_id of command.guildId) {
				guilds.add(guild_id);
			}
		}

		for (const guildId of guilds) {
			const guildCommands = filter.never
				.filter(cmd => cmd.guildId.includes(guildId) && (!('ignore' in cmd) || cmd.ignore !== IgnoreCommand.Slash))
				.map(x => x.toJSON());
			const shouldUploadGuild = !cachePath || (await this.shouldUploadCommands(cachePath, guildId));
			if (shouldUploadGuild) {
				await this.proxy.applications(applicationId).guilds(guildId).commands.put({
					body: guildCommands,
				});
			}
			await this.emitUploadCommandsMetadata({
				applicationId,
				cachePath,
				commands: guildCommands.length,
				guildId,
				reason: cachePath ? (shouldUploadGuild ? 'cache-miss' : 'cache-hit') : 'forced',
				scope: 'guild',
				status: shouldUploadGuild ? 'uploaded' : 'skipped',
			});
		}

		if (cachePath) await this.syncCachePath(cachePath);
	}

	private async emitUploadCommandsMetadata(metadata: PluginUploadCommandsMetadata) {
		await this.emitPluginCustomEvent('uploadCommands', metadata);
	}

	async loadCommands(dir?: string) {
		dir ??= await this.getRC().then(x => x.locations.commands);
		if (dir && this.commands) {
			await this.commands.load(dir, this, {
				create: (constructor, next) => this.runPluginHandlerCreators('command', constructor, next),
				transform: command => this.runPluginHandlerTransformers('command', command),
			});
			this.logger.info('CommandHandler loaded');
		}
	}

	async loadComponents(dir?: string) {
		dir ??= await this.getRC().then(x => x.locations.components);
		if (dir && this.components) {
			await this.components.load(dir, {
				create: (kind, constructor, next) => this.runPluginHandlerCreators(kind, constructor, next),
				transform: (kind, component) => this.runPluginHandlerTransformers(kind, component),
			});
			this.logger.info('ComponentHandler loaded');
		}
	}

	async loadLangs(dir?: string) {
		dir ??= await this.getRC().then(x => x.locations.langs);
		if (dir && this.langs) {
			await this.langs.load(dir);
			this.logger.info('LangsHandler loaded');
		}
		this.langBaseValues = this.langs ? cloneRecursive(this.langs.values) : this.langBaseValues;
		this.applyPluginLangs();
	}

	private applyPluginLangs() {
		if (!this.langs) return;
		const localeContributions = orderedPluginContributions(this.pluginRegistry.langs);
		const values: Partial<Record<string, any>> = cloneRecursive(this.langBaseValues);
		for (const contribution of localeContributions) {
			const current = (values[contribution.locale] as Record<string, any>) ?? {};
			values[contribution.locale] = MergeOptions(
				current,
				createNestedLangValues(contribution.prefix, cloneRecursive(contribution.values)),
			);
		}
		this.langs.values = values;
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
				const errors = e.errors.map((err: Error) => ({
					error: err,
					message: err.message.replace(/seyfert\.config\.(js|mjs|cjs|ts|mts|cts)/g, 'seyfert.config'),
				}));

				const uniqueError = errors.find(er => errors.filter(err => err.message === er.message).length === 1);
				if (uniqueError) {
					throw new SeyfertError('SEYFERT_CONFIG_LOAD_ERROR', {
						metadata: { detail: uniqueError.message },
						cause: uniqueError.error,
					});
				}
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
	plugins?: readonly AnySeyfertPlugin[];
	contextScopes?: readonly ContextScope[];
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
	globalMiddlewares?: readonly (keyof ResolvedRegisteredMiddlewares)[];
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
			onMiddlewaresError?: (
				context: CommandContext | MenuCommandContext<any, never>,
				error: string,
				metadata: PluginMiddlewareDenialMetadata,
			) => unknown;
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

function createNestedLangValues(prefix: string, values: Record<string, unknown>) {
	const route = prefix.split('.').filter(Boolean);
	const clonedValues = cloneRecursive(values) as Record<string, unknown>;
	const root: Record<string, unknown> = {};
	let current = root;

	for (let i = 0; i < route.length; i++) {
		const key = route[i]!;
		if (i === route.length - 1) {
			current[key] = clonedValues;
			break;
		}
		const nested: Record<string, unknown> = {};
		current[key] = nested;
		current = nested;
	}

	return root;
}

function cloneRecursive<T>(value: T): T {
	if (Array.isArray(value)) return value.map(item => cloneRecursive(item)) as T;
	if (!value || typeof value !== 'object') return value;

	const entries = value as Record<string, unknown>;
	const cloned = {} as Record<string, unknown>;
	for (const key of Object.keys(entries)) {
		cloned[key] = cloneRecursive(entries[key]);
	}
	return cloned as T;
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
	middlewares?: ClientMiddlewares;
	handleCommand?: typeof HandleCommand;
}
