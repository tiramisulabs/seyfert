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
 * throw new SeyfertError('INVALID_TOKEN', {
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
	code: SeyfertErrorCode;

	/**
	 * Optional contextual data attached to the error.
	 */
	metadata?: Record<string, unknown>;

	/**
	 * Creates a SeyfertError instance.
	 *
	 * @param code Machine-readable error code.
	 * @param options Additional error options.
	 * @param options.metadata Optional contextual metadata for diagnostics.
	 * @param options.cause Original error that caused this error.
	 */
	constructor(code: SeyfertErrorCode, options?: { metadata?: Record<string, unknown>; cause?: unknown }) {
		super(resolveSeyfertErrorMessage(code), { cause: options?.cause });
		this.code = code;
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

export function createValidationMetadata(expected: unknown, received: unknown, metadata: Record<string, unknown> = {}) {
	const receivedType = received === null ? 'null' : Array.isArray(received) ? 'array' : typeof received;
	return {
		...metadata,
		expected,
		received,
		receivedType,
	};
}

export const SeyfertErrorMessages = {
	INTERNAL_ERROR: 'Internal error.',
	INVALID_TOKEN: 'Invalid token.',
	FUNCTION_NOT_IMPLEMENTED: 'Function not implemented.',
	NO_SEYFERT_CONFIG_FILE_FOUND: 'No seyfert.config file found.',
	BAD_OPTION: 'Bad option.',
	INVALID_EMOJI: 'Invalid emoji.',
	EMOJI_NOT_RESOLVABLE: 'Emoji not resolvable.',
	INVALID_OPTIONS_LENGTH: 'Invalid options length.',
	MISSING_COMPONENT: 'Cannot convert to JSON without a component.',
	MISSING_ACCESSORY: 'Cannot convert to JSON without an accessory.',
	INVALID_ATTACHMENT_TYPE: 'Invalid attachment type.',
	INVALID_ANSWER_ID: 'Invalid answer id.',
	UNDEFINED_LOCALE: 'Undefined locale.',
	INTERACTION_ALREADY_REPLIED: 'Interaction already replied.',
	CANNOT_USE_REPLY_IN_THIS_INTERACTION: 'Cannot use reply in this interaction.',
	RELOAD_NOT_SUPPORTED_IN_CLOUDFLARE_WORKER: 'Reload in Cloudflare worker is not supported.',
	API_WORKER_PROXY_PARENT_REQUIRED: 'Cannot use workerProxy without a parent.',
	WORKER_TIMEOUT: 'Worker request timed out.',
	WORKER_THREADS_REQUIRED: 'worker_threads is required for this operation.',
	WORKER_AND_SHARD_ID_REQUIRED: 'workerId and shardId are required.',
	WORKER_NOT_FOUND: 'Worker not found.',
	INVALID_SHARD_ID: 'Invalid shardId.',
	INVALID_WORKER_REQUEST: 'Invalid request from unavailable worker.',
	CANNOT_OVERRIDE_EXISTING_SHARD: 'Cannot override existing shard.',
	INVALID_SEC_WEBSOCKET_ACCEPT_HEADER: 'Invalid sec-websocket-accept header.',
	CACHE_TIMEOUT: 'Cache request timed out.',
	CACHE_USERS_DISABLED: 'Users cache is disabled.',
	CACHE_MEMBERS_DISABLED: 'Members cache is disabled.',
	CACHE_CHANNELS_DISABLED: 'Channels cache is disabled.',
	CACHE_OVERWRITES_DISABLED: 'Overwrites cache is disabled.',
	CACHE_USERS_VALUES_SIZE_MISMATCH: 'Users values size does not match expected size.',
	CACHE_USERS_COUNT_MISMATCH: 'Users count does not match expected amount.',
	CACHE_USERS_COUNT_NOT_ZERO: 'Users count should be zero.',
	CACHE_MEMBERS_GUILD_VALUES_SIZE_MISMATCH: 'Guild members values size does not match expected size.',
	CACHE_MEMBERS_GUILD_COUNT_MISMATCH: 'Guild members count does not match expected amount.',
	CACHE_MEMBERS_VALUES_SIZE_MISMATCH: 'Members values size does not match expected size.',
	CACHE_MEMBERS_GLOBAL_COUNT_MISMATCH: 'Global members count does not match expected amount.',
	CACHE_MEMBERS_COUNT_NOT_ZERO: 'Members count should be zero.',
	CACHE_CHANNELS_GUILD_VALUES_SIZE_MISMATCH: 'Guild channels values size does not match expected size.',
	CACHE_CHANNELS_GUILD_COUNT_MISMATCH: 'Guild channels count does not match expected amount.',
	CACHE_CHANNELS_VALUES_SIZE_MISMATCH: 'Channels values size does not match expected size.',
	CACHE_CHANNELS_COUNT_MISMATCH: 'Channels count does not match expected amount.',
	CACHE_CHANNELS_COUNT_NOT_ZERO: 'Channels count should be zero.',
	CACHE_OVERWRITES_CHANNEL_VALUES_SIZE_MISMATCH: 'Channel overwrites values size does not match expected size.',
	CACHE_OVERWRITES_CHANNEL_COUNT_MISMATCH: 'Channel overwrites count does not match expected amount.',
	CACHE_OVERWRITE_NOT_FOUND: 'Overwrite cache entry was not found.',
	CACHE_OVERWRITES_COUNT_NOT_ZERO: 'Overwrites count should be zero.',
	INVALID_RETRY_AFTER: 'Could not extract retry_after from 429 response.',
	DENO_FILE_API_UNSUPPORTED: 'Deno file API limitation encountered.',
};

export type SeyfertErrorCode = keyof typeof SeyfertErrorMessages | (string & {});

function resolveSeyfertErrorMessage(code: SeyfertErrorCode) {
	const preset = SeyfertErrorMessages[code as keyof typeof SeyfertErrorMessages];
	if (preset) return preset;
	return code
		.toLowerCase()
		.split('_')
		.filter(Boolean)
		.map(word => word[0]!.toUpperCase() + word.slice(1))
		.join(' ');
}
