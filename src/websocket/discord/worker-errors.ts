import { SeyfertError } from '../../common';
import type { SerializedWorkerError, SerializedWorkerValue } from './workermanager';

function safeString(value: unknown) {
	try {
		return String(value);
	} catch {
		return '<unprintable>';
	}
}

function isError(value: unknown): value is Error {
	try {
		return value instanceof Error;
	} catch {
		return false;
	}
}

function isArray(value: unknown): value is unknown[] {
	try {
		return Array.isArray(value);
	} catch {
		return false;
	}
}

function serializeWorkerValue(value: unknown, ancestors: WeakSet<object>): SerializedWorkerValue {
	if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
	if (typeof value === 'number') return Number.isFinite(value) ? value : safeString(value);
	if (typeof value !== 'object') return value === undefined ? '[undefined]' : safeString(value);
	if (ancestors.has(value)) return '[Circular]';
	ancestors.add(value);
	try {
		if (isError(value)) return serializeError(value, ancestors);
		if (isArray(value)) return value.map(item => serializeWorkerValue(item, ancestors));
		const result = Object.create(null) as Record<string, SerializedWorkerValue>;
		for (const [key, item] of Object.entries(value)) result[key] = serializeWorkerValue(item, ancestors);
		return { type: 'record', value: result };
	} catch (error) {
		return `[Unserializable value: ${isError(error) ? error.message : safeString(error)}]`;
	} finally {
		ancestors.delete(value);
	}
}

function serializeMetadata(metadata: Record<string, unknown>, ancestors: WeakSet<object>) {
	if (ancestors.has(metadata)) return { value: '[Circular]' };
	ancestors.add(metadata);
	try {
		const result = Object.create(null) as Record<string, SerializedWorkerValue>;
		for (const [key, value] of Object.entries(metadata)) result[key] = serializeWorkerValue(value, ancestors);
		return result;
	} catch (error) {
		return { value: `[Unserializable value: ${isError(error) ? error.message : safeString(error)}]` };
	} finally {
		ancestors.delete(metadata);
	}
}

function serializeError(error: Error, ancestors: WeakSet<object>): SerializedWorkerError {
	const result: SerializedWorkerError = {
		type: 'error',
		name: error.name,
		message: error.message,
		stack: error.stack,
	};
	if (error instanceof SeyfertError) {
		result.code = error.code;
		if (error.metadata) result.metadata = serializeMetadata(error.metadata, ancestors);
	}
	if (error.cause !== undefined) result.cause = serializeWorkerValue(error.cause, ancestors);
	return result;
}

export function serializeWorkerError(error: unknown): SerializedWorkerError {
	const ancestors = new WeakSet<object>();
	if (typeof error === 'object' && error !== null && isError(error)) {
		ancestors.add(error);
		try {
			return serializeError(error, ancestors);
		} catch (serializationError) {
			return { type: 'error', name: 'Error', message: `Unserializable error: ${safeString(serializationError)}` };
		}
	}
	return { type: 'error', name: 'Error', message: safeString(error), cause: serializeWorkerValue(error, ancestors) };
}

function deserializeWorkerValue(value: SerializedWorkerValue): unknown {
	if (typeof value !== 'object' || value === null) return value;
	if (Array.isArray(value)) return value.map(deserializeWorkerValue);
	if (value.type === 'error') return deserializeWorkerError(value);
	return Object.fromEntries(Object.entries(value.value).map(([key, item]) => [key, deserializeWorkerValue(item)]));
}

function deserializeMetadata(metadata: Record<string, SerializedWorkerValue>) {
	return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, deserializeWorkerValue(value)]));
}

export function deserializeWorkerError(error: SerializedWorkerError) {
	const cause = error.cause === undefined ? undefined : deserializeWorkerValue(error.cause);
	const metadata = error.metadata ? deserializeMetadata(error.metadata) : undefined;
	const result =
		error.code !== undefined ? new SeyfertError(error.code, { metadata, cause }) : new Error(error.message, { cause });
	result.name = error.name;
	result.message = error.message;
	if (error.stack !== undefined) result.stack = error.stack;
	return result;
}
