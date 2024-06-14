export * from './application_command';
export * from './auto_moderation';
export * from './channel';
export * from './custom';
export * from './dispatch';
export * from './entitlement';
export * from './guild';
export * from './integration';
export * from './interactions';
export * from './invite';
export * from './message';
export * from './presence';
export * from './stage';
export * from './thread';
export * from './typing';
export * from './user';
export * from './voice';
export * from './webhook';

import type { CamelCase } from '../../common';
import type * as RawEvents from './index';

export type ClientEvents = {
	[X in keyof typeof RawEvents as CamelCase<X>]: ReturnType<(typeof RawEvents)[X]>;
};
