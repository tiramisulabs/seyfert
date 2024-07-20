export * from './application';
export * from './auditLog';
export * from './autoModeration';
export * from './channel';
export * from './emoji';
export * from './gateway';
export * from './guild';
export * from './guildScheduledEvent';
export * from './interactions';
export * from './invite';
export * from './oauth2';
export * from './poll';
export * from './permissions';
export * from './stageInstance';
export * from './sticker';
export * from './teams';
export * from './template';
export * from './user';
export * from './voice';
export * from './webhook';
export * from './monetization';

import type { LocaleString } from '../rest';

export type LocalizationMap = Partial<Record<LocaleString, string | null>>;

/**
 * https://discord.com/developers/docs/topics/opcodes-and-status-codes#json
 */
export interface RESTError {
	code: number;
	message: string;
	errors?: RESTErrorData;
}

export interface RESTErrorFieldInformation {
	code: string;
	message: string;
}

export interface RESTErrorGroupWrapper {
	_errors: RESTErrorData[];
}

export type RESTErrorData = RESTErrorFieldInformation | RESTErrorGroupWrapper | string | { [k: string]: RESTErrorData };

/**
 * https://discord.com/developers/docs/topics/rate-limits#exceeding-a-rate-limit-rate-limit-response-structure
 */
export interface RESTRateLimit {
	/**
	 * An error code for some limits
	 *
	 * {@link RESTJSONErrorCodes}
	 */
	code?: number;
	/**
	 * A value indicating if you are being globally rate limited or not
	 */
	global: boolean;
	/**
	 * A message saying you are being rate limited.
	 */
	message: string;
	/**
	 * The number of seconds to wait before submitting another request.
	 */
	retry_after: number;
}
