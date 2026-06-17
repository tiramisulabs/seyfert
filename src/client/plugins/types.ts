import type { ApiRequestOptions, HttpMethods } from '../../api/shared';
import type { BaseResource, Cache } from '../../cache';
import type {
	AnyMiddlewareContext,
	Command,
	CommandContext,
	ContextMenuCommand,
	EntryPointCommand,
	EntryPointContext,
	MenuCommandContext,
	MiddlewareContext,
	SubCommand,
	UsingClient,
} from '../../commands';
import type { CommandAutocompleteOption } from '../../commands/applications/chat';
import type { HandleableCommand, HandleableCommandInstance } from '../../commands/handler';
import type { Awaitable } from '../../common/types/util';
import type { ComponentCommand, ModalCommand } from '../../components';
import type { ClientNameEvents, CustomEventsKeys } from '../../events';
import type { GatewayEvents, ResolveEventParams } from '../../events/handler';
import type { AutocompleteInteraction } from '../../structures';
import type { GatewayDispatchPayload, GatewayIntentBits, GatewaySendPayload, LocaleString } from '../../types';
import type { BaseClient, BaseClientOptions } from '../base';
import type { MessageStructure, OptionResolverStructure } from '../transformers';

export interface SeyfertRegistry {}

export interface RegisteredPluginShared {}

export interface SharedKey<T, Name extends string = string> {
	readonly name: Name;
	readonly __shared?: T;
}

export type SharedValue<T> = T extends SharedKey<infer Value, string> ? Value : never;

export interface PluginSharedRegistry {
	get<const Name extends keyof RegisteredPluginShared & string>(name: Name): RegisteredPluginShared[Name] | undefined;
	get<T, const Name extends string>(key: SharedKey<T, Name>): T | undefined;
	unwrap<const Name extends keyof RegisteredPluginShared & string>(name: Name): RegisteredPluginShared[Name];
	unwrap<T, const Name extends string>(key: SharedKey<T, Name>): T;
	has<const Name extends string>(name: Name | SharedKey<unknown, Name>): boolean;
}

export interface PluginSharedOptions<T> {
	dispose?: (value: T) => Awaitable<void>;
	override?: boolean;
}

export interface PluginLangOptions {
	readonly prefix: string;
}

export interface PluginCommandContributionOptions extends PluginContributionOptions {
	guilds?: readonly string[];
}

export interface PluginMiddlewareDenialMetadata {
	middleware: string;
	scope: 'global' | 'command';
}

export enum PluginOrder {
	Before = 'before',
	After = 'after',
}

export type PluginOrderOpt = PluginOrder.Before | PluginOrder.After | number;
export type PluginDiagnosticSeverity = 'info' | 'warn' | 'error';
export type PluginDiagnosticCode =
	| 'missing-optional-requirement'
	| 'unknown-intent-bits'
	| 'gateway-payload-veto'
	| 'contribution-override'
	| 'contribution-removed'
	| 'command-guild-scope'
	| 'static-keys-multi-instance'
	| (string & {});
export type PluginLifecycleStatus = 'registered' | 'setting-up' | 'ready' | 'closing' | 'closed' | 'failed';
export type PluginRequirement = `plugin:${string}`;
export type SemverRange = string;
export type PluginRequirementInput =
	| PluginRequirement
	| { req: PluginRequirement; range?: SemverRange; optional?: boolean }
	| { capability: SharedKey<unknown, string>; optional?: boolean };
export type PluginIntentResolvable = keyof typeof GatewayIntentBits | GatewayIntentBits | number;
export type PluginLifecyclePhase =
	| 'resolve'
	| 'requires'
	| 'options'
	| 'register'
	| 'client'
	| 'ctx'
	| 'shared'
	| 'commands.add'
	| 'components.add'
	| 'setup'
	| 'teardown'
	| `event:${string}`;

export interface PluginDiagnosticMessage {
	plugin: string;
	instanceId?: string;
	index: number;
	phase: PluginLifecyclePhase | string;
	severity: PluginDiagnosticSeverity;
	code?: PluginDiagnosticCode;
	message: string;
	data?: Record<string, unknown>;
}

export interface PluginRequirementDiagnostic {
	kind: 'plugin' | 'capability';
	req: PluginRequirement | string;
	range?: SemverRange;
	resolvedVersion?: string;
	optional: boolean;
	satisfied: boolean;
}

export interface PluginLoadedMetadata<TKind extends 'commands' | 'components', TItem = unknown> {
	kind: TKind;
	total: number;
	items: readonly TItem[];
	plugin: {
		total: number;
		sources: Readonly<Record<string, number>>;
	};
}

export interface PluginUploadCommandsMetadata {
	applicationId: string;
	cachePath?: string;
	commands: number;
	guildId?: string;
	reason: 'cache-hit' | 'cache-miss' | 'forced';
	scope: 'global' | 'guild';
	status: 'skipped' | 'uploaded';
}

export interface PluginAutocompletePayload {
	client: BaseClient;
	command?: CommandAutocompleteOption;
	interaction: AutocompleteInteraction;
	optionsResolver: OptionResolverStructure;
}

export type PluginAutocompleteNext = () => Awaitable<void>;
export type PluginAutocompleteWrapper = (
	payload: PluginAutocompletePayload,
	next: PluginAutocompleteNext,
) => Awaitable<void>;

export interface PluginGatewayPayload {
	client: BaseClient;
	payload: GatewaySendPayload;
	shardId: number;
}

export type PluginGatewayPayloadWrapper = (
	payload: PluginGatewayPayload,
) => Awaitable<GatewaySendPayload | null | undefined | void>;

export interface PluginRestRequestPayload {
	readonly client: BaseClient;
	readonly method: HttpMethods;
	readonly url: `/${string}`;
	readonly request: Readonly<ApiRequestOptions>;
}

export interface PluginRestSuccessPayload extends PluginRestRequestPayload {
	readonly response: Response;
}

export interface PluginRestFailPayload extends PluginRestRequestPayload {
	readonly error: unknown;
	readonly statusCode?: number;
}

export interface PluginRestRatelimitPayload extends PluginRestRequestPayload {
	readonly response: Response;
}

export interface PluginRestObserver {
	onRequest?(payload: PluginRestRequestPayload): Awaitable<unknown>;
	onSuccess?(payload: PluginRestSuccessPayload): Awaitable<unknown>;
	onFail?(payload: PluginRestFailPayload): Awaitable<unknown>;
	onRatelimit?(payload: PluginRestRatelimitPayload): Awaitable<unknown>;
}

export type PluginCacheResourceConstructor<T extends BaseResource = BaseResource> = new (
	cache: Cache,
	client: UsingClient,
) => T;

export interface PluginCacheResourceOptions {
	onPacket?(event: GatewayDispatchPayload, cache: Cache): Awaitable<void>;
	intents?: readonly PluginIntentResolvable[];
}

export interface SeyfertPluginHooks {
	'plugins:ready': [client: BaseClient];
	'commands:beforeLoad': [client: BaseClient, dir: string | undefined];
	'commands:afterLoad': [metadata: PluginLoadedMetadata<'commands'>];
	'components:afterLoad': [metadata: PluginLoadedMetadata<'components'>];
	'client:close': [client: BaseClient];
}

export type PluginHookName = keyof SeyfertPluginHooks & string;
export type PluginHookPayload<K extends PluginHookName> = SeyfertPluginHooks[K] extends readonly unknown[]
	? SeyfertPluginHooks[K]
	: never;
type PluginHookPayloadClientView<T, E extends object> = T extends BaseClient ? T & E : T;
type PluginHookPayloadTupleView<T extends readonly unknown[], E extends object> = T extends readonly [
	infer Head,
	...infer Tail,
]
	? [PluginHookPayloadClientView<Head, E>, ...PluginHookPayloadTupleView<Tail, E>]
	: [];
export type PluginHookPayloadFor<K extends PluginHookName, E extends object = {}> = PluginHookPayloadTupleView<
	PluginHookPayload<K>,
	E
>;
export type PluginHookHandler<K extends PluginHookName = PluginHookName, E extends object = {}> = (
	...args: PluginHookPayloadFor<K, E>
) => Awaitable<unknown>;

export type SeyfertPluginOptions<TOptions extends BaseClientOptions = BaseClientOptions> = Partial<
	Omit<TOptions, 'plugins'>
>;
export type SeyfertCommandDefaults<TOptions extends BaseClientOptions = BaseClientOptions> = NonNullable<
	NonNullable<TOptions['commands']>['defaults']
>;
export type SeyfertComponentDefaults<TOptions extends BaseClientOptions = BaseClientOptions> = NonNullable<
	NonNullable<TOptions['components']>['defaults']
>;
export type SeyfertModalDefaults<TOptions extends BaseClientOptions = BaseClientOptions> = NonNullable<
	NonNullable<TOptions['modals']>['defaults']
>;

export type PluginClientMap<T extends object, I extends readonly AnySeyfertPlugin[] = readonly []> = {
	readonly [K in keyof T]: (client: BaseClient & ExtendOf<I>) => T[K];
};

export type PluginContextInteraction = Parameters<NonNullable<BaseClientOptions['context']>>[0] | MessageStructure;

export type PluginContextMap<
	T extends object,
	I extends readonly AnySeyfertPlugin[] = readonly [],
	E extends object = {},
> = {
	readonly [K in keyof T]: (interaction: PluginContextInteraction, client: BaseClient & ExtendOf<I> & E) => T[K];
};

export type PluginMiddlewareMap = Record<string, AnyMiddlewareContext>;
export type AnySeyfertPlugin = SeyfertPlugin<any, any, readonly AnySeyfertPlugin[], any>;

export type PluginExtensionOf<T> = T extends SeyfertPlugin<infer E, any, any, any> ? E : {};
export type PluginContextOf<T> = T extends SeyfertPlugin<any, infer C, any, any> ? C : {};
export type PluginMiddlewaresOf<T> = T extends SeyfertPlugin<any, any, any, infer M>
	? IsOpenPluginMiddlewareMap<M> extends true
		? {}
		: M
	: {};

export type ExtendOf<TPlugins extends readonly AnySeyfertPlugin[]> = UnionToIntersection<
	PluginExtensionOf<TPlugins[number]>
>;

export type ContextOf<TPlugins extends readonly AnySeyfertPlugin[]> = UnionToIntersection<
	PluginContextOf<TPlugins[number]>
>;
export type MiddlewaresOf<TPlugins extends readonly AnySeyfertPlugin[]> = UnionToIntersection<
	PluginMiddlewaresOf<TPlugins[number]>
>;

export type RegisteredPlugins = SeyfertRegistry extends { plugins: infer T extends readonly AnySeyfertPlugin[] }
	? T
	: readonly [];
export type RegisteredPluginExtension = Materialize<ExtendOf<RegisteredPlugins>>;
export type RegisteredPluginContext = Materialize<ContextOf<RegisteredPlugins>>;
export type RegisteredPluginMiddlewares = Materialize<MiddlewaresOf<RegisteredPlugins>>;
export type PluginUsingClient<TPlugins extends readonly AnySeyfertPlugin[] = RegisteredPlugins> = BaseClient &
	Materialize<ExtendOf<TPlugins>>;
export type PluginContextMapOf<TPlugins extends readonly AnySeyfertPlugin[] = RegisteredPlugins> = Materialize<
	ContextOf<TPlugins>
>;
export type PluginMiddlewaresMapOf<TPlugins extends readonly AnySeyfertPlugin[] = RegisteredPlugins> = Materialize<
	MiddlewaresOf<TPlugins>
>;

type UnionToIntersection<T> = (T extends unknown ? (value: T) => void : never) extends (value: infer R) => void
	? R
	: never;
type IsAny<T> = 0 extends 1 & T ? true : false;
type IsOpenPluginMiddlewareMap<T> = IsAny<T> extends true ? true : string extends keyof T ? true : false;
type Materialize<T> = {
	[K in keyof T]: T[K];
};

export type HandleableComponent = new () => ComponentCommand;
export type HandleableModal = new () => ModalCommand;
export type PluginCommandInstance = HandleableCommandInstance;
export type PluginComponentInstance = ComponentCommand;
export type PluginModalInstance = ModalCommand;
export type PluginCommandLoadable = HandleableCommand | PluginCommandInstance;
export type PluginComponentLoadable = HandleableComponent | PluginComponentInstance;
export type PluginModalLoadable = HandleableModal | PluginModalInstance;
export type PluginHandlerKind = 'command' | 'component' | 'modal';
export type PluginHandlerConstructor = HandleableCommand | HandleableComponent | HandleableModal;
export type PluginHandlerInstance = PluginCommandInstance | PluginComponentInstance | PluginModalInstance;
export interface PluginHandlerMetadata {
	kind: PluginHandlerKind;
}
export interface PluginHandlerCreator {
	<T extends PluginHandlerConstructor>(
		constructor: T,
		next: () => InstanceType<T>,
		metadata: PluginHandlerMetadata,
	): InstanceType<T>;
}
export interface PluginHandlerTransformer {
	<T extends PluginHandlerInstance>(instance: T, metadata: PluginHandlerMetadata): T | void;
}
export interface PluginHandlerOptions {
	kinds?: readonly PluginHandlerKind[];
	order?: PluginOrderOpt;
}
export type PluginEventDisposer = () => void;
export type PluginEventErrorHandler = (error: unknown, name: string) => unknown;
export interface PluginContributionOptions {
	override?: boolean;
}
export interface PluginMiddlewareOptions extends PluginContributionOptions {
	global?: boolean;
	order?: PluginOrderOpt;
}
export type PluginCommandObserverContext = CommandContext | MenuCommandContext<any, never> | EntryPointContext;
export type PluginCommandObserverCommand = Command | SubCommand | ContextMenuCommand | EntryPointCommand;
export interface PluginCommandObserver {
	onBeforeOptions?(context: CommandContext): Awaitable<unknown>;
	onBeforeMiddlewares?(context: PluginCommandObserverContext): Awaitable<unknown>;
	onMiddlewaresError?(
		context: PluginCommandObserverContext,
		error: string,
		metadata: PluginMiddlewareDenialMetadata,
	): Awaitable<unknown>;
	onRunError?(context: PluginCommandObserverContext, error: unknown): Awaitable<unknown>;
	onAfterRun?(context: PluginCommandObserverContext, error: unknown | undefined): Awaitable<unknown>;
	onInternalError?(client: UsingClient, command: PluginCommandObserverCommand, error?: unknown): Awaitable<unknown>;
}

export interface SeyfertPluginApi<M extends PluginMiddlewareMap = PluginMiddlewareMap, E extends object = {}> {
	has(req: PluginRequirement): boolean;
	events: {
		on<E extends ClientNameEvents | CustomEventsKeys | GatewayEvents>(
			name: E,
			handler: (...args: ResolveEventParams<E>) => unknown,
			opts?: { once?: boolean; order?: PluginOrderOpt },
		): PluginEventDisposer;
		once<E extends ClientNameEvents | CustomEventsKeys | GatewayEvents>(
			name: E,
			handler: (...args: ResolveEventParams<E>) => unknown,
		): PluginEventDisposer;
		onAny(
			handler: (name: string, ...args: unknown[]) => unknown,
			opts?: { order?: PluginOrderOpt },
		): PluginEventDisposer;
		onError(handler: PluginEventErrorHandler, opts?: { order?: PluginOrderOpt }): PluginEventDisposer;
	};
	commands: {
		add(...commands: PluginCommandLoadable[]): void;
		add(...args: [...commands: PluginCommandLoadable[], opts: PluginCommandContributionOptions]): void;
		remove(...names: string[]): void;
		observe(observer: PluginCommandObserver, opts?: { order?: PluginOrderOpt }): PluginEventDisposer;
		defaults(
			hooks: Partial<SeyfertCommandDefaults>,
			opts?: { suppressDefault?: boolean | readonly (keyof SeyfertCommandDefaults)[]; order?: PluginOrderOpt },
		): void;
	};
	rest: {
		observe(observer: PluginRestObserver, order?: PluginOrderOpt): PluginEventDisposer;
	};
	hooks: {
		tap<K extends PluginHookName>(
			name: K,
			handler: PluginHookHandler<K, E>,
			opts?: { order?: PluginOrderOpt },
		): PluginEventDisposer;
	};
	handlers: {
		create(creator: PluginHandlerCreator, opts?: PluginHandlerOptions): void;
		transform(transformer: PluginHandlerTransformer, opts?: PluginHandlerOptions): void;
	};
	components: {
		add(...components: PluginComponentLoadable[]): void;
		add(...args: [...components: PluginComponentLoadable[], opts: PluginContributionOptions]): void;
		remove(...customIds: string[]): void;
		defaults(
			hooks: Partial<SeyfertComponentDefaults>,
			opts?: { suppressDefault?: boolean | readonly (keyof SeyfertComponentDefaults)[]; order?: PluginOrderOpt },
		): void;
	};
	modals: {
		add(...modals: PluginModalLoadable[]): void;
		add(...args: [...modals: PluginModalLoadable[], opts: PluginContributionOptions]): void;
		remove(...customIds: string[]): void;
		defaults(
			hooks: Partial<SeyfertModalDefaults>,
			opts?: { suppressDefault?: boolean | readonly (keyof SeyfertModalDefaults)[]; order?: PluginOrderOpt },
		): void;
	};
	middlewares: {
		add<const Name extends keyof M & string>(name: Name, middleware: M[Name], opts?: PluginMiddlewareOptions): void;
		add(name: string, middleware: MiddlewareContext, opts?: PluginMiddlewareOptions): void;
		remove(...names: string[]): void;
	};
	autocomplete: {
		wrap(wrapper: PluginAutocompleteWrapper, opts?: { order?: PluginOrderOpt }): void;
	};
	gateway: {
		addIntents(...intents: PluginIntentResolvable[]): void;
		wrapPayload(wrapper: PluginGatewayPayloadWrapper, opts?: { order?: PluginOrderOpt }): void;
	};
	cache: {
		resource(name: string, resource: PluginCacheResourceConstructor, opts?: PluginCacheResourceOptions): void;
	};
	shared: {
		set<T, const Name extends string>(
			key: SharedKey<T, Name>,
			factory: (client: BaseClient & E) => T,
			opts?: PluginSharedOptions<T>,
		): void;
		set<const Name extends keyof RegisteredPluginShared & string>(
			name: Name,
			factory: (client: BaseClient & E) => RegisteredPluginShared[Name],
			opts?: PluginSharedOptions<RegisteredPluginShared[Name]>,
		): void;
		remove(...names: (string | SharedKey<unknown, string>)[]): void;
		has<const Name extends string>(name: Name | SharedKey<unknown, Name>): boolean;
	};
	langs: {
		contribute(locale: LocaleString | string, values: Record<string, unknown>, opts: PluginLangOptions): void;
	};
	reload(): Promise<void>;
	diagnostics: {
		warn(
			message: string,
			options?: { code?: PluginDiagnosticCode; phase?: PluginLifecyclePhase | string; data?: Record<string, unknown> },
		): void;
	};
	options: {
		set(fragment: SeyfertPluginOptions): void;
	};
}

export type ResolvedPluginList = readonly AnySeyfertPlugin[] & {
	readonly resolved: readonly AnySeyfertPlugin[];
	readonly diagnostics: readonly PluginDiagnostics[];
};

export type SeyfertPluginClient = BaseClient & {
	plugins: ResolvedPluginList;
};

export interface SeyfertPlugin<
	E extends object = {},
	C extends object = {},
	I extends readonly AnySeyfertPlugin[] = readonly [],
	M extends PluginMiddlewareMap = {},
> {
	name: string;
	instanceId?: string;
	imports?: I;
	requires?: readonly PluginRequirementInput[];
	meta?: unknown;
	client?: PluginClientMap<E, I>;
	ctx?: PluginContextMap<C, I, E>;
	middlewares?: M;
	globalMiddlewares?: readonly (keyof M & string)[];
	options?(current: Readonly<BaseClientOptions>): SeyfertPluginOptions;
	register?(api: SeyfertPluginApi<M, ExtendOf<I> & E>): void;
	setup?(client: SeyfertPluginClient & ExtendOf<I> & E, api?: SeyfertPluginApi<M, ExtendOf<I> & E>): Awaitable<void>;
	teardown?(client: SeyfertPluginClient & ExtendOf<I> & E, api?: SeyfertPluginApi<M, ExtendOf<I> & E>): Awaitable<void>;
}

export interface PluginDiagnostics {
	name: string;
	instanceId?: string;
	index: number;
	status: PluginLifecycleStatus;
	imports: readonly string[];
	clientKeys: readonly string[];
	ctxKeys: readonly string[];
	commands: number;
	components: number;
	modals: number;
	events: readonly string[];
	middlewares: readonly string[];
	requirements: readonly PluginRequirementDiagnostic[];
	shared: readonly string[];
	autocompleteWrappers: number;
	gatewayPayloadWrappers: number;
	messages: readonly PluginDiagnosticMessage[];
}
