import { SeyfertError, type SeyfertErrorCode } from '../../common/it/error';

export type SeyfertPluginErrorCode = 'PLUGIN_FAILED' | 'PLUGIN_TEARDOWN_FAILED';

export class SeyfertPluginError extends SeyfertError {
	readonly plugin: string;
	readonly instanceId?: string;
	readonly phase: string;
	readonly index: number;

	constructor(
		plugin: string,
		phase: string,
		index: number,
		cause: unknown,
		code: SeyfertPluginErrorCode = 'PLUGIN_FAILED',
		instanceId?: string,
	) {
		super(code, { metadata: pluginMetadata(plugin, phase, index, instanceId), cause });
		this.name = 'SeyfertPluginError';
		this.plugin = plugin;
		this.instanceId = instanceId;
		this.phase = phase;
		this.index = index;
		this.message = `Seyfert plugin "${formatPluginIdentity(plugin, instanceId)}" failed during ${phase} at index ${index}: ${formatPluginCause(cause)}`;
		Error.captureStackTrace?.(this, SeyfertPluginError);
	}
}

export class SeyfertPluginAggregateError extends SeyfertError {
	override name = 'SeyfertPluginAggregateError';
	readonly errors: unknown[];
	override cause: unknown;

	constructor(
		code: SeyfertPluginErrorCode,
		plugin: string,
		phase: string,
		index: number,
		errors: Iterable<unknown>,
		message?: string,
		cause?: unknown,
		instanceId?: string,
	) {
		const collected = Array.from(errors);
		const resolvedCause = cause ?? causeOf(collected[0]);
		super(code, { metadata: pluginMetadata(plugin, phase, index, instanceId), cause: resolvedCause });
		this.message = message ?? resolvePluginAggregateMessage(code);
		this.errors = collected;
		this.cause = resolvedCause;
		Error.captureStackTrace?.(this, SeyfertPluginAggregateError);
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
			code: this.code,
			metadata: this.metadata,
			cause: this.cause,
			errors: this.errors,
		};
	}
}

export function wrapPluginError(
	plugin: string,
	phase: string,
	index: number,
	cause: unknown,
	code?: SeyfertPluginErrorCode,
	instanceId?: string,
) {
	if (cause instanceof SeyfertPluginError) return cause;
	if (cause instanceof SeyfertPluginAggregateError) return cause;
	return new SeyfertPluginError(plugin, phase, index, cause, code, instanceId);
}

export function createPluginConflictError(
	plugin: string,
	phase: string,
	index: number,
	detail: string,
	instanceId?: string,
) {
	return wrapPluginError(plugin, phase, index, new Error(detail), undefined, instanceId);
}

function formatPluginCause(cause: unknown) {
	if (cause instanceof Error) return cause.message;
	return String(cause);
}

function formatPluginIdentity(plugin: string, instanceId: string | undefined) {
	return instanceId ? `${plugin}#${instanceId}` : plugin;
}

function pluginMetadata(plugin: string, phase: string, index: number, instanceId: string | undefined) {
	if (instanceId) return { plugin, instanceId, phase, index };
	return { plugin, phase, index };
}

function causeOf(error: unknown) {
	if (error && typeof error === 'object' && 'cause' in error) return (error as { cause?: unknown }).cause ?? error;
	return error;
}

function resolvePluginAggregateMessage(code: SeyfertErrorCode) {
	return code === 'PLUGIN_TEARDOWN_FAILED' ? 'Seyfert plugin teardown failed.' : 'Seyfert plugin failed.';
}
