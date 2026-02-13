//
export * from './bot/watcher';
export * from './it/colors';
export * from './it/constants';
export * from './it/formatter';
export { AssignFilenameCallback, CustomizeLoggerCallback, Logger, LoggerOptions, LogLevels } from './it/logger';
export * from './it/utils';
export * from './shorters/application';
//
export * from './shorters/channels';
export * from './shorters/emojis';
export * from './shorters/guilds';
export * from './shorters/interaction';
// circular lol
export * from './shorters/invites';
export * from './shorters/members';
export * from './shorters/messages';
export * from './shorters/reactions';
export * from './shorters/roles';
export * from './shorters/templates';
export * from './shorters/threads';
export * from './shorters/users';
export * from './shorters/webhook';
//
export * from './types/options';
export * from './types/resolvables';
export * from './types/util';
export * from './types/write';

export function createValidationMetadata(expected: unknown, received: unknown, metadata: Record<string, unknown> = {}) {
	const receivedType = received === null ? 'null' : Array.isArray(received) ? 'array' : typeof received;
	return {
		...metadata,
		expected,
		received,
		receivedType,
	};
}

/**
 * Base error type used by Seyfert.
 *
 * It supports optional machine-readable metadata and preserves the original
 * cause when wrapping lower-level errors.
 *
 * @remarks
 * For validation errors, prefer structured metadata (you can use
 * {@link createValidationMetadata}) with:
 * - `expected`: expected value or shape
 * - `received`: received value
 * - `receivedType`: optional primitive/runtime type
 *
 * @example
 * ```ts
 * throw new SeyfertError('Invalid token', {
 *   code: 'INVALID_TOKEN',
 *   metadata: { shardId: 0 },
 * });
 * ```
 */
export class SeyfertError extends Error {
	/**
	 * Error name used in logs and stack traces.
	 */
	override name = 'SeyfertError';

	/**
	 * Optional machine-readable error identifier.
	 */
	code?: string;

	/**
	 * Optional contextual data attached to the error.
	 */
	metadata?: Record<string, unknown>;

	/**
	 * Creates a SeyfertError instance.
	 *
	 * @param message Human-readable error message.
	 * @param options Additional error options.
	 * @param options.code Optional machine-readable error code.
	 * @param options.metadata Optional contextual metadata for diagnostics.
	 * @param options.cause Original error that caused this error.
	 */
	constructor(message?: string, options?: { code?: string; metadata?: Record<string, unknown>; cause?: unknown }) {
		super(message, { cause: options?.cause });
		this.code = options?.code;
		this.metadata = options?.metadata;
		Error.captureStackTrace?.(this, SeyfertError);
	}

	/**
	 * Serializes the error into a plain object.
	 *
	 * @returns Serializable error payload including name, message, code, metadata and cause.
	 */
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			metadata: this.metadata,
			cause: this.cause,
		};
	}
}
