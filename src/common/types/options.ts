import type { Identify } from '..';
import type { CDNUrlOptions } from '../../api';
import type { UsingClient } from '../../commands';

export type ImageOptions = CDNUrlOptions;

export type MethodContext<T = {}> = Identify<{ client: UsingClient } & T>;

export type MessageWebhookPayload<Body, Extra = {}> = Identify<{ body: Body } & Extra>;
