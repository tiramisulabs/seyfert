/// <reference types="node" />
import type { Session, Events } from '@biscuitland/core';
import { EventEmitter } from 'node:events';
export interface CollectorOptions<E extends keyof Events> {
    event: E;
    filter?(...args: Parameters<Events[E]>): unknown;
    max?: number;
    time?: number;
    idle?: number;
}
export declare class Collector<E extends keyof Events> extends EventEmitter {
    readonly session: Session;
    options: CollectorOptions<E>;
    collected: Set<unknown>;
    ended: boolean;
    private timeout;
    constructor(session: Session, options: CollectorOptions<E>);
    private collect;
    stop(reason?: string): void;
    on(event: 'collect', listener: (...args: Parameters<Events[E]>) => unknown): this;
    on(event: 'end', listener: (reason: string | null | undefined, collected: Set<Parameters<Events[E]>[0]>) => void): this;
    once(event: 'collect', listener: (...args: Parameters<Events[E]>) => unknown): this;
    once(event: 'end', listener: (reason: string | null | undefined, collected: Set<Parameters<Events[E]>[0]>) => void): this;
}
