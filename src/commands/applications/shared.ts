import type {
	CategoryChannelStructure,
	DirectoryChannelStructure,
	DMChannelStructure,
	ForumChannelStructure,
	MediaChannelStructure,
	NewsChannelStructure,
	StageChannelStructure,
	TextGuildChannelStructure,
	ThreadChannelStructure,
	VoiceChannelStructure,
} from '../../client';
import type { BaseClient } from '../../client/base';
import type { RegisteredPluginContext, RegisteredPluginExtension, SeyfertRegistry } from '../../client/plugins';
import type { IsStrictlyUndefined } from '../../common';
import type { ChannelType } from '../../types';
import type { ResolvedRegisteredMiddlewares } from '../decorators';

export type OKFunction<T> = (value: T) => void;
export type StopFunction = (error: string) => void;
export type NextFunction<T = unknown> = IsStrictlyUndefined<T> extends true ? () => void : (data: T) => void;
export type PassFunction = () => void;

export type InferWithPrefix = InternalOptions extends { withPrefix: infer P } ? P : false;

export interface GlobalMetadata {}
export type DefaultLocale = SeyfertRegistry extends { langs: infer L extends Record<string, any> } ? L : {};
export interface ExtendContext extends RegisteredPluginContext {}
export interface ExtraProps {}
export type UsingClient = BaseClient &
	RegisteredPluginExtension &
	(SeyfertRegistry extends { client: infer C } ? C : unknown);
export interface CustomWorkerClientEvents {}
export interface CustomWorkerManagerEvents {}
export interface ExtendedRC {}
export interface ExtendedRCLocations {}
export type ParseClient<T extends BaseClient> = T;
export type ParseGlobalMiddlewares<T extends Record<string, AnyMiddlewareContext>> = {
	[K in keyof T]: MetadataMiddleware<T[K]>;
};
export interface InternalOptions {}
export interface CustomStructures {}

export type MiddlewareContext<T = any, C = any> = (context: {
	context: C;
	next: NextFunction<T>;
	stop: StopFunction;
	pass: PassFunction;
}) => any;
export type AnyMiddlewareContext = (context: {
	context: any;
	next: any;
	stop: StopFunction;
	pass: PassFunction;
}) => any;
export type MetadataMiddleware<T extends AnyMiddlewareContext> = T extends (context: infer Payload) => any
	? Payload extends { next: (...args: infer Args) => unknown }
		? IsStrictlyUndefined<Args[0]> extends true
			? never
			: Args[0]
		: never
	: never;

type MetadataForMiddleware<T extends keyof ResolvedRegisteredMiddlewares> =
	ResolvedRegisteredMiddlewares[T] extends infer Middleware extends AnyMiddlewareContext
		? MetadataMiddleware<Middleware>
		: never;

type OmitNever<T extends object> = {
	[key in keyof T as [T[key]] extends [never] ? never : key]: T[key];
};

type MiddlewareMetadata<T extends keyof ResolvedRegisteredMiddlewares> = OmitNever<{
	[key in T]: MetadataForMiddleware<key>;
}>;

type CommandMetadataFromUnion<T extends keyof ResolvedRegisteredMiddlewares> = [T] extends [never]
	? {}
	: MiddlewareMetadata<T>;

type CommandMetadataFromTuple<T extends readonly (keyof ResolvedRegisteredMiddlewares)[]> = T extends readonly [
	infer first,
	...infer rest,
]
	? first extends keyof ResolvedRegisteredMiddlewares
		? MiddlewareMetadata<first> &
				(rest extends readonly (keyof ResolvedRegisteredMiddlewares)[] ? CommandMetadataFromTuple<rest> : never)
		: {}
	: {};

export type CommandMetadata<
	T extends readonly (keyof ResolvedRegisteredMiddlewares)[] | keyof ResolvedRegisteredMiddlewares,
> = [T] extends [never]
	? {}
	: [T] extends [readonly (keyof ResolvedRegisteredMiddlewares)[]]
		? CommandMetadataFromTuple<T>
		: [T] extends [keyof ResolvedRegisteredMiddlewares]
			? CommandMetadataFromUnion<T>
			: {};

export type MessageCommandOptionErrors =
	| ['CHANNEL_TYPES', type: ChannelType[]]
	| ['STRING_MIN_LENGTH', min: number]
	| ['STRING_MAX_LENGTH', max: number]
	| ['STRING_INVALID_CHOICE', choices: readonly { name: string; value: string }[]]
	| ['NUMBER_NAN', value: string]
	| ['NUMBER_MIN_VALUE', min: number]
	| ['NUMBER_MAX_VALUE', max: number]
	| ['NUMBER_INVALID_CHOICE', choices: readonly { name: string; value: number }[]]
	| ['NUMBER_OUT_OF_BOUNDS', value: number]
	| ['OPTION_REQUIRED']
	| ['UNKNOWN', error: unknown];

export type OnOptionsReturnObject = Record<
	string,
	| {
			failed: false;
			value: unknown;
	  }
	| {
			failed: true;
			value: string;
			parseError: //only for text command
			MessageCommandOptionErrors | undefined;
	  }
>;

export enum IgnoreCommand {
	Slash = 0,
	Message = 1,
}

export interface SeyfertChannelMap {
	[ChannelType.GuildText]: TextGuildChannelStructure;
	[ChannelType.DM]: DMChannelStructure;
	[ChannelType.GuildVoice]: VoiceChannelStructure;
	[ChannelType.GroupDM]: DMChannelStructure;
	[ChannelType.GuildCategory]: CategoryChannelStructure;
	[ChannelType.GuildAnnouncement]: NewsChannelStructure;
	[ChannelType.AnnouncementThread]: ThreadChannelStructure;
	[ChannelType.PublicThread]: ThreadChannelStructure;
	[ChannelType.PrivateThread]: ThreadChannelStructure;
	[ChannelType.GuildStageVoice]: StageChannelStructure;
	[ChannelType.GuildDirectory]: DirectoryChannelStructure;
	[ChannelType.GuildForum]: ForumChannelStructure;
	[ChannelType.GuildMedia]: MediaChannelStructure;
}
