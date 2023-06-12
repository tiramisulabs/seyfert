import { MakeRequired, Options } from '@biscuitland/common';
import { type Session, Handler } from '@biscuitland/core';
import { GatewayEvents } from '@biscuitland/ws';
import { EventEmitter } from 'node:events';

interface CollectorOptions<E extends keyof GatewayEvents> {
  event: `${E}`;
  filter?: (...args: Parameters<Handler[E]>) => unknown;
  max?: number;
  time?: number;
  idle?: number;
}

export const DEFAULT_OPTIONS = {
  filter: () => true,
  max: -1
};

export enum CollectorStatus {
  Idle = 0,
  Started = 1,
  Ended = 2
}

export class EventCollector<E extends keyof GatewayEvents> extends EventEmitter {
  collected = new Set<Parameters<Handler[E]>[0]>();
  status: CollectorStatus = CollectorStatus.Idle;
  options: MakeRequired<CollectorOptions<E>, 'filter' | 'max'>;
  private timeout: NodeJS.Timeout | null = null;

  constructor(readonly session: Session, rawOptions: CollectorOptions<E>) {
    super();
    this.options = Options(DEFAULT_OPTIONS, rawOptions);
  }

  start() {
    this.session.setMaxListeners(this.session.getMaxListeners() + 1);
    this.session.on(this.options.event, (...args: unknown[]) => this.collect(...(args as Parameters<Handler[E]>)));
    this.timeout = setTimeout(() => this.stop('time'), this.options.idle ?? this.options.time);
  }

  private collect(...args: Parameters<Handler[E]>) {
    if (this.options.filter?.(...args)) {
      this.collected.add(args[0]);
      this.emit('collect', ...args);
    }

    if (this.options.idle) {
      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => this.stop('time'), this.options.idle);
    }

    if (this.collected.size >= this.options.max!) this.stop('max');
  }

  stop(reason = 'User stopped') {
    if (this.status === CollectorStatus.Ended) return;

    if (this.timeout) clearTimeout(this.timeout);

    this.session.removeListener(this.options.event, (...args: unknown[]) => this.collect(...(args as Parameters<Handler[E]>)));
    this.session.setMaxListeners(this.session.getMaxListeners() - 1);

    this.status = CollectorStatus.Ended;
    this.emit('end', reason, this.collected);
  }

  on(event: 'collect', listener: (...args: Parameters<Handler[E]>) => unknown): this;
  on(event: 'end', listener: (reason: string | null | undefined, collected: Set<Parameters<Handler[E]>[0]>) => void): this;
  on(event: string, listener: unknown): this {
    return super.on(event, listener as () => unknown);
  }

  once(event: 'collect', listener: (...args: Parameters<Handler[E]>) => unknown): this;
  once(event: 'end', listener: (reason: string | null | undefined, collected: Set<Parameters<Handler[E]>[0]>) => void): this;
  once(event: string, listener: unknown): this {
    return super.once(event, listener as () => unknown);
  }
}
