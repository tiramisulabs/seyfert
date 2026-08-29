import { chatInputInteraction, modalSubmitInteraction } from '@slipher/testing';
import { describe, expect, test, vi } from 'vitest';
import { BaseInteraction, type Interaction, Modal, type ModalSubmitInteraction } from '../lib';
import { ComponentHandler } from '../src/components/handler';

function createClient() {
	const logger = { error: vi.fn(), fatal: vi.fn(), warn: vi.fn() };
	const client = { cache: {}, logger, options: {} };
	Object.assign(client, { components: new ComponentHandler(logger as never, client as never) });
	return client as any;
}

function createInteraction(client: any, userId: string, customIds?: string[]) {
	return BaseInteraction.from(
		client,
		chatInputInteraction({ name: 'profile', guildId: null, userId }) as never,
		async ({ body }: any) => {
			customIds?.push(body.data.custom_id);
		},
	) as Interaction;
}

function createSubmit(client: any, userId: string, customId: string) {
	return BaseInteraction.from(
		client,
		modalSubmitInteraction({ customId, fields: {}, guildId: null, userId }) as never,
	) as ModalSubmitInteraction;
}

describe('modal waiters', () => {
	test('preserves custom modal serialization and custom id when isolating callback state', async () => {
		class CustomModal extends Modal {
			#title = 'Custom serialization';

			override toJSON() {
				return { ...super.toJSON(), title: this.#title };
			}
		}
		const client = createClient();
		const callback = vi.fn();
		const reply = vi.fn(async () => {});
		const interaction = BaseInteraction.from(
			client,
			chatInputInteraction({ name: 'profile', guildId: null, userId: 'user-a' }) as never,
			reply,
		) as Interaction;
		const modal = new CustomModal().setCustomId('profile').setTitle('Profile').run(callback);

		await interaction.modal(modal);

		expect(reply).toHaveBeenCalledWith({
			body: expect.objectContaining({
				data: expect.objectContaining({ custom_id: 'profile', title: 'Custom serialization' }),
			}),
			files: undefined,
		});
		expect(modal.data.custom_id).toBe('profile');
		const submitted = createSubmit(client, 'user-a', 'profile');
		await client.components.onModalSubmit(submitted);
		expect(callback).toHaveBeenCalledWith(submitted);
	});

	test('routes Modal.run callbacks without waiter options', async () => {
		const client = createClient();
		const callback = vi.fn();
		let sentCustomId: string | undefined;
		const reply = vi.fn(async ({ body }: any) => {
			sentCustomId = body.data.custom_id;
		});
		const interaction = BaseInteraction.from(
			client,
			chatInputInteraction({ name: 'profile', guildId: null, userId: 'user-a' }) as never,
			reply,
		) as Interaction;
		const modal = new Modal().setCustomId('profile').setTitle('Profile').run(callback);

		await interaction.modal(modal);

		expect(sentCustomId).toBe('profile');
		expect(modal.data.custom_id).toBe('profile');
		const submitted = createSubmit(client, 'user-a', 'profile');
		await client.components.onModalSubmit(submitted);
		expect(callback).toHaveBeenCalledWith(submitted);
		expect(submitted.customId).toBe('profile');
	});

	test('routes a waiter without changing its custom id', async () => {
		const client = createClient();
		let sentCustomId: string | undefined;
		const reply = vi.fn(async ({ body }: any) => {
			sentCustomId = body.data.custom_id;
		});
		const interaction = BaseInteraction.from(
			client,
			chatInputInteraction({ name: 'profile', guildId: null, userId: 'user-a' }) as never,
			reply,
		) as Interaction;
		const modal = new Modal().setCustomId('profile').setTitle('Profile');
		const waiting = interaction.modal(modal, { waitFor: 1_000 });
		await vi.waitFor(() => expect(sentCustomId).toBe('profile'));
		await vi.waitFor(() => expect(client.components.hasModal(createSubmit(client, 'user-a', 'profile'))).toBe(true));

		const submitted = createSubmit(client, 'user-a', 'profile');
		await client.components.onModalSubmit(submitted);

		await expect(waiting).resolves.toBe(submitted);
		expect(submitted.customId).toBe('profile');
		expect(modal.data.custom_id).toBe('profile');
	});

	test('uses a new public custom id when reusing a modal builder', async () => {
		const client = createClient();
		const sentCustomIds: string[] = [];
		const modal = new Modal().setCustomId('profile').setTitle('Profile');

		const first = createInteraction(client, 'user-a', sentCustomIds).modal(modal, { waitFor: 1_000 });
		await vi.waitFor(() => expect(sentCustomIds).toEqual(['profile']));
		await vi.waitFor(() => expect(client.components.hasModal(createSubmit(client, 'user-a', 'profile'))).toBe(true));
		await client.components.onModalSubmit(createSubmit(client, 'user-a', 'profile'));
		await first;

		modal.setCustomId('settings');
		const second = createInteraction(client, 'user-a', sentCustomIds).modal(modal, { waitFor: 1_000 });
		await vi.waitFor(() => expect(sentCustomIds).toEqual(['profile', 'settings']));
		await vi.waitFor(() => expect(client.components.hasModal(createSubmit(client, 'user-a', 'settings'))).toBe(true));
		const submitted = createSubmit(client, 'user-a', 'settings');
		await client.components.onModalSubmit(submitted);
		await expect(second).resolves.toBe(submitted);
		expect(submitted.customId).toBe('settings');
		expect(modal.data.custom_id).toBe('settings');
	});

	test('isolates concurrent reuse of a modal builder by user and custom id', async () => {
		const client = createClient();
		const sentCustomIds: string[] = [];
		const modal = new Modal().setCustomId('profile').setTitle('Profile');

		const first = createInteraction(client, 'user-a', sentCustomIds).modal(modal, { waitFor: 1_000 });
		const second = createInteraction(client, 'user-b', sentCustomIds).modal(modal, { waitFor: 1_000 });
		await vi.waitFor(() => expect(sentCustomIds).toEqual(['profile', 'profile']));
		await vi.waitFor(() => {
			expect(client.components.hasModal(createSubmit(client, 'user-a', 'profile'))).toBe(true);
			expect(client.components.hasModal(createSubmit(client, 'user-b', 'profile'))).toBe(true);
		});
		const firstSubmit = createSubmit(client, 'user-a', 'profile');
		const secondSubmit = createSubmit(client, 'user-b', 'profile');
		await client.components.onModalSubmit(firstSubmit);
		await client.components.onModalSubmit(secondSubmit);

		await expect(first).resolves.toBe(firstSubmit);
		await expect(second).resolves.toBe(secondSubmit);
	});

	test('keeps different modal ids isolated for the same user', async () => {
		const client = createClient();
		const profile = vi.fn();
		const settings = vi.fn();

		await createInteraction(client, 'user-a').modal(
			new Modal().setCustomId('profile').setTitle('Profile').run(profile),
		);
		await createInteraction(client, 'user-a').modal(
			new Modal().setCustomId('settings').setTitle('Settings').run(settings),
		);

		const profileSubmit = createSubmit(client, 'user-a', 'profile');
		const settingsSubmit = createSubmit(client, 'user-a', 'settings');
		await client.components.onModalSubmit(profileSubmit);
		await client.components.onModalSubmit(settingsSubmit);

		expect(profile).toHaveBeenCalledWith(profileSubmit);
		expect(settings).toHaveBeenCalledWith(settingsSubmit);
	});

	test('replaces the previous callback for the same user and custom id', async () => {
		const client = createClient();
		const first = vi.fn();
		const second = vi.fn();

		await createInteraction(client, 'user-a').modal(new Modal().setCustomId('profile').setTitle('First').run(first));
		await createInteraction(client, 'user-a').modal(new Modal().setCustomId('profile').setTitle('Second').run(second));

		const submitted = createSubmit(client, 'user-a', 'profile');
		await client.components.onModalSubmit(submitted);

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledWith(submitted);
	});

	test('settles a replaced waiter for the same user and custom id', async () => {
		const client = createClient();
		const modal = new Modal().setCustomId('profile').setTitle('Profile');

		const first = createInteraction(client, 'user-a').modal(modal, { waitFor: 0 });
		const second = createInteraction(client, 'user-a').modal(modal, { waitFor: 0 });

		await expect(first).resolves.toBeNull();
		const submitted = createSubmit(client, 'user-a', 'profile');
		await client.components.onModalSubmit(submitted);
		await expect(second).resolves.toBe(submitted);
	});

	test('starts the waiter timeout after Discord accepts the modal', async () => {
		vi.useFakeTimers();
		try {
			const client = createClient();
			let acceptReply!: () => void;
			const replyAccepted = new Promise<void>(resolve => {
				acceptReply = resolve;
			});
			const interaction = BaseInteraction.from(
				client,
				chatInputInteraction({ name: 'profile', guildId: null, userId: 'user-a' }) as never,
				() => replyAccepted,
			) as Interaction;

			const waiting = interaction.modal(new Modal().setCustomId('profile').setTitle('Profile'), { waitFor: 10 });
			await vi.advanceTimersByTimeAsync(1_000);
			acceptReply();
			await vi.advanceTimersByTimeAsync(0);

			expect(client.components.hasModal(createSubmit(client, 'user-a', 'profile'))).toBe(true);
			await vi.advanceTimersByTimeAsync(10);
			await expect(waiting).resolves.toBeNull();
			expect(client.components.hasModal(createSubmit(client, 'user-a', 'profile'))).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	test('settles a waiter without an explicit timeout when modal state expires', async () => {
		vi.useFakeTimers();
		try {
			const client = createClient();
			const waiting = createInteraction(client, 'user-a').modal(
				new Modal().setCustomId('profile').setTitle('Profile'),
				{ waitFor: 0 },
			);
			await vi.advanceTimersByTimeAsync(0);

			await vi.advanceTimersByTimeAsync(60e3 * 10);

			await expect(waiting).resolves.toBeNull();
			expect(client.components.hasModal(createSubmit(client, 'user-a', 'profile'))).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	test('a callbackless modal replaces a pending callback with the same identity', async () => {
		const client = createClient();
		const callback = vi.fn();

		await createInteraction(client, 'user-a').modal(
			new Modal().setCustomId('profile').setTitle('With callback').run(callback),
		);
		await createInteraction(client, 'user-a').modal(new Modal().setCustomId('profile').setTitle('Without callback'));

		expect(client.components.hasModal(createSubmit(client, 'user-a', 'profile'))).toBe(false);
	});

	test('cleans the custom id Discord received when a callbackless builder changes during reply', async () => {
		const client = createClient();
		const callback = vi.fn();
		await createInteraction(client, 'user-a').modal(
			new Modal().setCustomId('profile').setTitle('With callback').run(callback),
		);
		let acceptReply!: () => void;
		const replyAccepted = new Promise<void>(resolve => {
			acceptReply = resolve;
		});
		let sentCustomId: string | undefined;
		const interaction = BaseInteraction.from(
			client,
			chatInputInteraction({ name: 'profile', guildId: null, userId: 'user-a' }) as never,
			async ({ body }: any) => {
				sentCustomId = body.data.custom_id;
				await replyAccepted;
			},
		) as Interaction;
		const modal = new Modal().setCustomId('profile').setTitle('Without callback');

		const opening = interaction.modal(modal);
		await vi.waitFor(() => expect(sentCustomId).toBe('profile'));
		modal.setCustomId('settings');
		acceptReply();
		await opening;

		expect(client.components.hasModal(createSubmit(client, 'user-a', 'profile'))).toBe(false);
		await client.components.onModalSubmit(createSubmit(client, 'user-a', 'profile'));
		expect(callback).not.toHaveBeenCalled();
	});

	test('registers the serialized custom id for direct modal replies', async () => {
		const client = createClient();
		const callback = vi.fn();
		let acceptReply!: () => void;
		const replyAccepted = new Promise<void>(resolve => {
			acceptReply = resolve;
		});
		let sentCustomId: string | undefined;
		const interaction = BaseInteraction.from(
			client,
			chatInputInteraction({ name: 'profile', guildId: null, userId: 'user-a' }) as never,
			async ({ body }: any) => {
				sentCustomId = body.data.custom_id;
				await replyAccepted;
			},
		) as Interaction;
		const modal = new Modal().setCustomId('profile').setTitle('Profile').run(callback);

		const opening = interaction.reply({ type: 9, data: modal } as never);
		await vi.waitFor(() => expect(sentCustomId).toBe('profile'));
		modal.setCustomId('settings');
		acceptReply();
		await opening;

		expect(client.components.hasModal(createSubmit(client, 'user-a', 'profile'))).toBe(true);
		expect(client.components.hasModal(createSubmit(client, 'user-a', 'settings'))).toBe(false);
	});
});
