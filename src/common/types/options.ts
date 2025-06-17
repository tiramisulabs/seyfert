import type { CDNUrlOptions } from '../../api';
import type { UsingClient } from '../../commands';
import type { Identify } from '..';

export type ImageOptions = CDNUrlOptions;

export type MethodContext<T = object> = Identify<{ client: UsingClient } & T>;

export type MessageWebhookPayload<Body, Extra = object> = Identify<{ body: Body } & Extra>;
