import { chatInputInteraction } from '@slipher/testing';
import { describe, expect, test, vi } from 'vitest';
import { type __InternalReplyFunction, BaseInteraction, type Interaction } from '../lib';

function createDeferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, reject, resolve };
}

function createInteraction(client: unknown, __reply?: __InternalReplyFunction) {
	const interaction = BaseInteraction.from(
		client as never,
		chatInputInteraction({ name: 'ping', guildId: null }) as never,
		__reply,
	) as Interaction;

	return interaction;
}

describe('interaction reply state', () => {
	test('keeps REST replies private while editOrReply waits to edit the original response', async () => {
		const pendingReply = createDeferred<undefined>();
		const editedMessage = { id: '100000000000000006' };
		const reply = vi.fn(() => pendingReply.promise);
		const editMessage = vi.fn(() => Promise.resolve(editedMessage));
		const interaction = createInteraction({
			options: {},
			interactions: {
				reply,
				editMessage,
			},
		});

		const initialReply = interaction.write({ content: 'initial' });

		expect(reply).toHaveBeenCalledTimes(1);
		expect(interaction.replied).toBeUndefined();

		const edit = interaction.editOrReply({ content: 'edited' }, true);

		await Promise.resolve();

		expect(editMessage).not.toHaveBeenCalled();
		expect(reply).toHaveBeenCalledTimes(1);

		pendingReply.resolve(undefined);

		await expect(initialReply).resolves.toBeUndefined();
		await expect(edit).resolves.toBe(editedMessage);
		expect(interaction.replied).toBe(true);
		expect(reply).toHaveBeenCalledTimes(1);
		expect(editMessage).toHaveBeenCalledTimes(1);
		expect(editMessage).toHaveBeenCalledWith(
			interaction.token,
			'@original',
			expect.objectContaining({ content: 'edited' }),
		);
	});

	test('keeps constructor replies private while editOrReply waits to edit the original response', async () => {
		const pendingReply = createDeferred<void>();
		const editedMessage = { id: '100000000000000007' };
		const restReply = vi.fn();
		const editMessage = vi.fn(() => Promise.resolve(editedMessage));
		const __reply = vi.fn(() => pendingReply.promise);
		const interaction = createInteraction(
			{
				options: {},
				interactions: {
					reply: restReply,
					editMessage,
				},
			},
			__reply,
		);

		const initialReply = interaction.write({ content: 'initial' });

		expect(__reply).toHaveBeenCalledTimes(1);
		expect(restReply).not.toHaveBeenCalled();
		expect(interaction.replied).toBeUndefined();

		const edit = interaction.editOrReply({ content: 'edited' }, true);

		await Promise.resolve();

		expect(editMessage).not.toHaveBeenCalled();

		pendingReply.resolve();

		await expect(initialReply).resolves.toBeUndefined();
		await expect(edit).resolves.toBe(editedMessage);
		expect(interaction.replied).toBe(true);
		expect(restReply).not.toHaveBeenCalled();
		expect(editMessage).toHaveBeenCalledTimes(1);
	});

	test('keeps a failed REST reply terminal and rolls back deferred state', async () => {
		const failure = new Error('reply failed');
		const reply = vi.fn(() => Promise.reject(failure));
		const editMessage = vi.fn();
		const interaction = createInteraction({
			options: {},
			interactions: { editMessage, reply },
		});

		await expect(interaction.deferReply()).rejects.toBe(failure);

		expect(interaction.replied).toBeUndefined();
		expect(interaction.deferred).toBeUndefined();
		await expect(interaction.write({ content: 'retry' })).rejects.toBe(failure);
		await expect(interaction.editOrReply({ content: 'retry' })).rejects.toBe(failure);
		await expect(interaction.deferReply()).rejects.toBe(failure);
		expect(interaction.deferred).toBeUndefined();
		expect(reply).toHaveBeenCalledTimes(1);
		expect(editMessage).not.toHaveBeenCalled();
	});

	test('shares an in-progress failure with editOrReply without retrying', async () => {
		const pendingReply = createDeferred<undefined>();
		const failure = new Error('pending reply failed');
		const reply = vi.fn(() => pendingReply.promise);
		const editMessage = vi.fn();
		const interaction = createInteraction({
			options: {},
			interactions: { editMessage, reply },
		});

		const initialReply = interaction.write({ content: 'initial' });
		const edit = interaction.editOrReply({ content: 'edited' });
		pendingReply.reject(failure);

		await expect(initialReply).rejects.toBe(failure);
		await expect(edit).rejects.toBe(failure);
		expect(reply).toHaveBeenCalledTimes(1);
		expect(editMessage).not.toHaveBeenCalled();
	});
});
