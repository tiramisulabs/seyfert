import type { ChannelType } from 'discord-api-types/v10';
import type { BaseClient } from '../../client/base';
import type { IsStrictlyUndefined } from '../../common';
import type { RegisteredMiddlewares } from '../decorators';

export type OKFunction<T> = (value: T) => void;
export type StopFunction = (error: string) => void;
export type NextFunction<T = unknown> = IsStrictlyUndefined<T> extends true ? () => void : (data: T) => void;
export type PassFunction = () => void;

export type InferWithPrefix = InternalOptions extends { withPrefix: infer P } ? P : false;

export interface GlobalMetadata {}
export interface DefaultLocale {}
export interface ExtendContext {}
export interface ExtraProps {}
export interface UsingClient extends BaseClient {}
export type ParseClient<T extends BaseClient> = T;
export interface InternalOptions {}
export interface CustomStructures {}

export type MiddlewareContext<T = any, C = any> = (context: {
	context: C;
	next: NextFunction<T>;
	stop: StopFunction;
	pass: PassFunction;
}) => any;
export type MetadataMiddleware<T extends MiddlewareContext> = IsStrictlyUndefined<
	Parameters<Parameters<T>[0]['next']>[0]
> extends true
	? never
	: Parameters<Parameters<T>[0]['next']>[0];
export type CommandMetadata<T extends readonly (keyof RegisteredMiddlewares)[]> = T extends readonly [
	infer first,
	...infer rest,
]
	? first extends keyof RegisteredMiddlewares
		? (MetadataMiddleware<RegisteredMiddlewares[first]> extends never
				? {}
				: {
						[key in first]: MetadataMiddleware<RegisteredMiddlewares[first]>;
					}) &
				(rest extends readonly (keyof RegisteredMiddlewares)[] ? CommandMetadata<rest> : {})
		: {}
	: {};

export type MessageCommandOptionErrors =
	| ['CHANNEL_TYPES', type: ChannelType[]]
	| ['STRING_MIN_LENGTH', min: number]
	| ['STRING_MAX_LENGTH', max: number]
	| ['STRING_INVALID_CHOICE', choices: readonly { name: string; value: string }[]]
	| ['NUMBER_NAN', value: string | undefined]
	| ['NUMBER_MIN_VALUE', min: number]
	| ['NUMBER_MAX_VALUE', max: number]
	| ['NUMBER_INVALID_CHOICE', choices: readonly { name: string; value: number }[]]
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
