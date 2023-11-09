import type { GatewayEvents } from '@biscuitland/ws';
import type { Session } from '../index';

export function actionHandler([session, payload, shardId]: Parameters<ActionHandler>) {
  // @ts-expect-error At this point, typescript sucks
  session.emit(payload.t, payload.d, shardId);
  // @ts-expect-error At this point, typescript sucks
  session.emit('RAW', payload.d, shardId);
}

export type ActionHandler<G extends keyof GatewayEvents = keyof GatewayEvents,> = (
  ...args: [Session<true>, { t: G; d: GatewayEvents[G] }, number]
) => unknown;

export type Handler = {
  [K in keyof GatewayEvents]: (...args: [GatewayEvents[K], number]) => unknown;
};
