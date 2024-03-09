import type { Identify } from '..';
import type { ImageURLOptions } from '../../api';
import type { BaseClient } from '../../client/base';

export type ImageOptions = ImageURLOptions;

export type MethodContext<T = {}> = Identify<{ client: BaseClient } & T>;

export type MessageWebhookPayload<Body, Extra = {}> = Identify<{ body: Body } & Extra>;
