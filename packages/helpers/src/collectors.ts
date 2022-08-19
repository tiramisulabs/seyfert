import type { Session, Events } from '@biscuitland/core';
import { EventEmitter } from 'node:events';

export interface CollectorOptions<E extends keyof Events> {
    event: E;
    filter?(...args: Parameters<Events[E]>): unknown;
    max?: number;
    time?: number;
    idle?: number;
}

export class Collector<E extends keyof Events> extends EventEmitter {
    collected = new Set<Parameters<Events[E]>[0]>();
    ended = false;
    private timeout: NodeJS.Timeout;

    constructor(readonly session: Session, public options: CollectorOptions<E>) {
        super();

        if (!('filter' in this.options))
            this.options.filter = (() => true);

        if (!('max' in this.options))
            this.options.max = -1;

        this.session.events.setMaxListeners(this.session.events.getMaxListeners() + 1);

        this.session.events.on(this.options.event, (...args: unknown[]) => this.collect(...args as Parameters<Events[E]>));

        this.timeout = setTimeout(() => this.stop('time'), this.options.idle ?? this.options.time);
    }

    private collect(...args: Parameters<Events[E]>) {
        if (this.options.filter?.(...args)) {
            this.collected.add(args[0]);
            this.emit('collect', ...args);
        }

        if (this.options.idle) {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.stop('time'), this.options.idle);
        }

        if (this.collected.size >= this.options.max!)
            this.stop('max');
    }

    stop(reason?: string) {
        if (this.ended) return;

        clearTimeout(this.timeout);

        this.session.events.removeListener(this.options.event, (...args: unknown[]) => this.collect(...args as Parameters<Events[E]>));
        this.session.events.setMaxListeners(this.session.events.getMaxListeners() - 1);

        this.ended = true;
        this.emit('end', reason, this.collected);
    }

    on(event: 'collect', listener: (...args: Parameters<Events[E]>) => unknown): this;
    on(event: 'end', listener: (reason: string | null | undefined, collected: Set<Parameters<Events[E]>[0]>) => void): this;
    on(event: string, listener: unknown): this {
        return super.on(event, listener as (() => unknown));
    }

    once(event: 'collect', listener: (...args: Parameters<Events[E]>) => unknown): this;
    once(event: 'end', listener: (reason: string | null | undefined, collected: Set<Parameters<Events[E]>[0]>) => void): this;
    once(event: string, listener: unknown): this {
        return super.once(event, listener as (() => unknown));
    }
}
