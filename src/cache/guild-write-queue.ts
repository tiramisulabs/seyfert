import type { AsyncLocalStorage } from 'node:async_hooks';
import type { Awaitable } from '../common';
import type { GatewayDispatchPayload } from '../types';

const stages = { payload: 0, dispatch: 1, event: 2, hook: 3, cache: 4 };

/** @internal */
export type GuildWriteStage = keyof typeof stages;

type GuildWriteSlot = {
	guildId: string;
	ready: Promise<void>;
	release(): void;
};

type GuildWriteContext = {
	slot?: GuildWriteSlot;
	complete: boolean;
};

type GuildWriteScope = { queue: GuildWriteQueue; context: GuildWriteContext; stage: GuildWriteStage };

// A shared scope avoids retaining an AsyncLocalStorage instance for each rebuilt cache.
let dispatchScope: AsyncLocalStorage<GuildWriteScope> | undefined;

/** @internal Orders cache application for a single writer per guild. */
export class GuildWriteQueue {
	private tails = new Map<string, Promise<void>>();

	run<T>(packet: GatewayDispatchPayload, stage: GuildWriteStage, handle: () => Awaitable<T>): Promise<T> {
		const parent = dispatchScope?.getStore();
		const guildId = guildWriteTarget(packet);
		// A later stage can reserve a slot if an interceptor turns this into a guild write.
		if (!guildId && (parent?.queue !== this || !parent.context.slot)) return Promise.resolve(handle());
		// HTTP clients and disabled tracking do not need Node's async context support.
		if (!dispatchScope) {
			const { AsyncLocalStorage } = require('node:async_hooks') as typeof import('node:async_hooks');
			dispatchScope = new AsyncLocalStorage();
		}
		// Only forward progress borrows a slot. A nested dispatch starts its own cache phase.
		const context: GuildWriteContext =
			parent?.queue === this && !parent.context.complete && stages[stage] > stages[parent.stage]
				? parent.context
				: { complete: false };
		if (context.slot?.guildId !== guildId) {
			const previous = context.slot;
			// A redirected packet joins its destination when that guild becomes known.
			context.slot = guildId ? this.enqueue(guildId) : undefined;
			previous?.release();
		}
		const scope = { queue: this, context, stage };
		// Forwarded stages share their creator's cleanup and can return the handler's promise directly.
		if (context === parent?.context) return Promise.resolve(dispatchScope.run(scope, handle));
		return dispatchScope.run(scope, async () => {
			try {
				return await handle();
			} finally {
				// Release packets that never reach the cache.
				context.complete = true;
				context.slot?.release();
				context.slot = undefined;
			}
		});
	}

	write<T>(write: () => Awaitable<T>): Promise<T> {
		const current = dispatchScope?.getStore();
		const context = current?.queue === this ? current.context : undefined;
		if (!context) return Promise.resolve(write());
		return this.writeOrdered(context, write);
	}

	private async writeOrdered<T>(context: GuildWriteContext, write: () => Awaitable<T>): Promise<T> {
		const slot = context.slot;
		await slot?.ready;
		try {
			return await this.outside(write);
		} finally {
			// Event listeners and plugin cache handlers run after this slot is released.
			context.complete = true;
			context.slot = undefined;
			slot?.release();
		}
	}

	outside<T>(handle: () => T): T {
		return dispatchScope?.getStore() ? dispatchScope.exit(handle) : handle();
	}

	private enqueue(guildId: string): GuildWriteSlot {
		const ready = this.tails.get(guildId) ?? Promise.resolve();
		let release!: () => void;
		const tail = new Promise<void>(resolve => {
			// Even an early veto must keep later packets behind the preceding cache phase.
			release = () => resolve(ready);
		});
		this.tails.set(guildId, tail);
		void tail.then(() => {
			if (this.tails.get(guildId) === tail) this.tails.delete(guildId);
		});
		return { guildId, ready, release };
	}
}

function guildWriteTarget(event: GatewayDispatchPayload) {
	switch (event.t) {
		case 'GUILD_CREATE':
		case 'GUILD_UPDATE':
		case 'GUILD_DELETE':
		case 'RAW_GUILD_CREATE':
		case 'RAW_GUILD_DELETE':
			return event.d.id;
		case 'GUILD_MEMBER_ADD':
		case 'GUILD_MEMBER_REMOVE':
			return event.d.guild_id;
		default:
			return;
	}
}
