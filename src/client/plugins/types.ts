import type { MiddlewareContext } from '../../commands';
import type { HandleableCommand } from '../../commands/handler';
import type { Awaitable } from '../../common/types/util';
import type { ComponentCommand, ModalCommand } from '../../components';
import type { ClientNameEvents, CustomEventsKeys } from '../../events';
import type { GatewayEvents, ResolveEventParams, ResolveEventRunParams } from '../../events/handler';
import type { BaseClient, BaseClientOptions } from '../base';

export interface Register {}

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

export type PluginClientMap<T extends object> = {
	readonly [K in keyof T]: (client: BaseClient) => T[K];
};

export type PluginContextInteraction = Parameters<NonNullable<BaseClientOptions['context']>>[0];

export type PluginContextMap<T extends object> = {
	readonly [K in keyof T]: (interaction: PluginContextInteraction, client: BaseClient) => T[K];
};

export type AnySeyfertPlugin = SeyfertPlugin<any, any, readonly AnySeyfertPlugin[]>;

export type PluginExtensionOf<T> = T extends SeyfertPlugin<infer E, any, any> ? E : {};
export type PluginContextOf<T> = T extends SeyfertPlugin<any, infer C, any> ? C : {};

export type ExtendOf<TPlugins extends readonly AnySeyfertPlugin[]> = UnionToIntersection<
	PluginExtensionOf<TPlugins[number]>
>;

export type ContextOf<TPlugins extends readonly AnySeyfertPlugin[]> = UnionToIntersection<
	PluginContextOf<TPlugins[number]>
>;

export type RegisteredPlugins = Register extends { plugins: infer T extends readonly AnySeyfertPlugin[] }
	? T
	: readonly [];
export type RegisteredPluginExtension = Materialize<ExtendOf<RegisteredPlugins>>;
export type RegisteredPluginContext = Materialize<ContextOf<RegisteredPlugins>>;

type UnionToIntersection<T> = (T extends unknown ? (value: T) => void : never) extends (value: infer R) => void
	? R
	: never;
type Materialize<T> = {
	[K in keyof T]: T[K];
};

export type HandleableComponent = new () => ComponentCommand;
export type HandleableModal = new () => ModalCommand;

export interface SeyfertPluginApi {
	events: {
		on<E extends ClientNameEvents | CustomEventsKeys | GatewayEvents>(
			name: E,
			handler: (...args: ResolveEventParams<E>) => unknown,
			opts?: { once?: boolean },
		): void;
		onAny(handler: (name: string, ...args: unknown[]) => unknown): void;
		emit<E extends CustomEventsKeys>(name: E, ...payload: ResolveEventRunParams<E>): void;
	};
	commands: {
		add(...commands: HandleableCommand[]): void;
	};
	components: {
		add(...components: HandleableComponent[]): void;
	};
	modals: {
		add(...modals: HandleableModal[]): void;
	};
	middlewares: {
		add(name: string, middleware: MiddlewareContext, opts?: { global?: boolean }): void;
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
> {
	name: string;
	imports?: I;
	client?: PluginClientMap<E>;
	ctx?: PluginContextMap<C>;
	register?(api: SeyfertPluginApi): void;
	setup?(client: SeyfertPluginClient & ExtendOf<I> & E): Awaitable<void>;
	teardown?(client: SeyfertPluginClient & ExtendOf<I> & E): Awaitable<void>;
}

export interface PluginDiagnostics {
	name: string;
	index: number;
	imports: readonly string[];
	clientKeys: readonly string[];
	ctxKeys: readonly string[];
	commands: number;
	components: number;
	modals: number;
	events: readonly string[];
	middlewares: readonly string[];
}
