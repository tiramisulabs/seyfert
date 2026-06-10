import type { MiddlewareContext } from '../../commands';
import type { CommandAutocompleteOption } from '../../commands/applications/chat';
import type { HandleableCommand } from '../../commands/handler';
import type { Awaitable } from '../../common/types/util';
import type { ComponentCommand, ModalCommand } from '../../components';
import type { ClientNameEvents, CustomEventsKeys } from '../../events';
import type { GatewayEvents, ResolveEventParams, ResolveEventRunParams } from '../../events/handler';
import type { AutocompleteInteraction } from '../../structures';
import type { GatewayIntentBits, GatewaySendPayload } from '../../types';
import type { BaseClient, BaseClientOptions } from '../base';
import type { OptionResolverStructure } from '../transformers';

export interface Register {}
export type RegisterPlugins<TPlugins extends readonly AnySeyfertPlugin[]> = { plugins: TPlugins };

export interface RegisteredPluginServices {}

export interface ServiceKey<T, Name extends string = string> {
	readonly name: Name;
	readonly __service?: T;
}

export type ServiceValue<T> = T extends ServiceKey<infer Value, string> ? Value : never;

export interface PluginServiceRegistry {
	get<const Name extends keyof RegisteredPluginServices & string>(
		name: Name,
	): RegisteredPluginServices[Name] | undefined;
	get<T, const Name extends string>(key: ServiceKey<T, Name>): T | undefined;
	require<const Name extends keyof RegisteredPluginServices & string>(name: Name): RegisteredPluginServices[Name];
	require<T, const Name extends string>(key: ServiceKey<T, Name>): T;
	has<const Name extends string>(name: Name | ServiceKey<unknown, Name>): boolean;
}

export type PluginDiagnosticSeverity = 'warn';
export type PluginLifecycleStatus = 'registered' | 'setting-up' | 'ready' | 'closing' | 'closed' | 'failed';
export type PluginRequirement = `plugin:${string}`;
export type PluginRequirementInput = PluginRequirement | { req: PluginRequirement; optional?: boolean };
export type PluginIntentResolvable = keyof typeof GatewayIntentBits | GatewayIntentBits | number;
export type PluginLifecyclePhase =
	| 'resolve'
	| 'requires'
	| 'options'
	| 'register'
	| 'client'
	| 'ctx'
	| 'services'
	| 'commands.add'
	| 'components.add'
	| 'setup'
	| 'teardown'
	| `event:${string}`;

export interface PluginDiagnosticMessage {
	plugin: string;
	index: number;
	phase: PluginLifecyclePhase | string;
	severity: PluginDiagnosticSeverity;
	code?: string;
	message: string;
}

export interface PluginRequirementDiagnostic {
	req: PluginRequirement;
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
export type PluginUsingClient<TPlugins extends readonly AnySeyfertPlugin[] = RegisteredPlugins> = BaseClient &
	Materialize<ExtendOf<TPlugins>>;
export type PluginContextMapOf<TPlugins extends readonly AnySeyfertPlugin[] = RegisteredPlugins> = Materialize<
	ContextOf<TPlugins>
>;

type UnionToIntersection<T> = (T extends unknown ? (value: T) => void : never) extends (value: infer R) => void
	? R
	: never;
type Materialize<T> = {
	[K in keyof T]: T[K];
};

export type HandleableComponent = new () => ComponentCommand;
export type HandleableModal = new () => ModalCommand;

export interface SeyfertPluginApi {
	has(req: PluginRequirement): boolean;
	events: {
		on<E extends ClientNameEvents | CustomEventsKeys | GatewayEvents>(
			name: E,
			handler: (...args: ResolveEventParams<E>) => unknown,
			opts?: { once?: boolean },
		): void;
		once<E extends ClientNameEvents | CustomEventsKeys | GatewayEvents>(
			name: E,
			handler: (...args: ResolveEventParams<E>) => unknown,
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
	autocomplete: {
		wrap(wrapper: PluginAutocompleteWrapper): void;
	};
	gateway: {
		addIntents(...intents: PluginIntentResolvable[]): void;
		wrapPayload(wrapper: PluginGatewayPayloadWrapper): void;
	};
	services: {
		set<T, const Name extends string>(key: ServiceKey<T, Name>, value: T | ((client: BaseClient) => T)): void;
		set<const Name extends keyof RegisteredPluginServices & string>(
			name: Name,
			value: RegisteredPluginServices[Name] | ((client: BaseClient) => RegisteredPluginServices[Name]),
		): void;
		has<const Name extends string>(name: Name | ServiceKey<unknown, Name>): boolean;
	};
	diagnostics: {
		warn(message: string, options?: { code?: string; phase?: PluginLifecyclePhase | string }): void;
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
	requires?: readonly PluginRequirementInput[];
	client?: PluginClientMap<E>;
	ctx?: PluginContextMap<C>;
	register?(api: SeyfertPluginApi): void;
	setup?(client: SeyfertPluginClient & ExtendOf<I> & E): Awaitable<void>;
	teardown?(client: SeyfertPluginClient & ExtendOf<I> & E): Awaitable<void>;
}

export interface PluginDiagnostics {
	name: string;
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
	services: readonly string[];
	autocompleteWrappers: number;
	gatewayPayloadWrappers: number;
	warnings: readonly PluginDiagnosticMessage[];
}
