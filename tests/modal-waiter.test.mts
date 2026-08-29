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

describe('modal waiters', () => {
	test('preserves custom modal subclasses while isolating wire state', async () => {
		class CustomModal extends Modal {
			#title = 'Custom serialization';

			override toJSON() {
				return { ...super.toJSON(), title: this.#title };
			}
		}
		const client = createClient();
		const reply = vi.fn(async () => {});
		const interaction = BaseInteraction.from(
			client,
			chatInputInteraction({ name: 'profile', guildId: null }) as never,
			reply,
		) as Interaction;
		const modal = new CustomModal().setCustomId('profile').setTitle('Profile');

		await interaction.modal(modal);

		expect(reply).toHaveBeenCalledWith({
			body: expect.objectContaining({
				data: expect.objectContaining({ custom_id: 'profile', title: 'Custom serialization' }),
			}),
			files: undefined,
		});
		expect(modal.data.custom_id).toBe('profile');
	});

	test('routes Modal.run callbacks without waiter options', async () => {
		const client = createClient();
		const callback = vi.fn();
		let wireCustomId: string | undefined;
		const reply = vi.fn(async ({ body }: any) => {
			wireCustomId = body.data.custom_id;
		});
		const interaction = BaseInteraction.from(
			client,
			chatInputInteraction({ name: 'profile', guildId: null }) as never,
			reply,
		) as Interaction;
		const modal = new Modal().setCustomId('profile').setTitle('Profile').run(callback);

		await interaction.modal(modal);

		expect(wireCustomId).toMatch(/^profile:/);
		expect(modal.data.custom_id).toBe('profile');
		const submitted = BaseInteraction.from(
			client,
			modalSubmitInteraction({ customId: wireCustomId!, fields: {}, guildId: null }) as never,
		) as ModalSubmitInteraction;
		await client.components.onModalSubmit(submitted);
		expect(callback).toHaveBeenCalledWith(submitted);
		expect(submitted.customId).toBe('profile');
	});

	test('routes a wire custom id to its callback while exposing the original id', async () => {
		const client = createClient();
		let wireCustomId: string | undefined;
		const reply = vi.fn(async ({ body }: any) => {
			wireCustomId = body.data.custom_id;
		});
		const interaction = BaseInteraction.from(
			client,
			chatInputInteraction({ name: 'profile', guildId: null }) as never,
			reply,
		) as Interaction;
		const modal = new Modal().setCustomId('profile').setTitle('Profile');
		const waiting = interaction.modal(modal, { waitFor: 1_000 });
		await vi.waitFor(() => expect(wireCustomId).toMatch(/^profile:/));

		const submitted = BaseInteraction.from(
			client,
			modalSubmitInteraction({ customId: wireCustomId!, fields: {}, guildId: null }) as never,
		) as ModalSubmitInteraction;
		await client.components.onModalSubmit(submitted);

		await expect(waiting).resolves.toBe(submitted);
		expect(submitted.customId).toBe('profile');
		expect(modal.data.custom_id).toBe('profile');
	});

	test('uses a new public custom id when reusing a modal builder', async () => {
		const client = createClient();
		const wireCustomIds: string[] = [];
		const createInteraction = () =>
			BaseInteraction.from(
				client,
				chatInputInteraction({ name: 'profile', guildId: null }) as never,
				async ({ body }: any) => {
					wireCustomIds.push(body.data.custom_id);
				},
			) as Interaction;
		const modal = new Modal().setCustomId('profile').setTitle('Profile');

		const first = createInteraction().modal(modal, { waitFor: 1_000 });
		await vi.waitFor(() => expect(wireCustomIds).toHaveLength(1));
		await client.components.onModalSubmit(
			BaseInteraction.from(
				client,
				modalSubmitInteraction({ customId: wireCustomIds[0], fields: {}, guildId: null }) as never,
			) as ModalSubmitInteraction,
		);
		await first;

		modal.setCustomId('settings');
		const second = createInteraction().modal(modal, { waitFor: 1_000 });
		await vi.waitFor(() => expect(wireCustomIds).toHaveLength(2));
		expect(wireCustomIds[1]).toMatch(/^settings:/);
		const submitted = BaseInteraction.from(
			client,
			modalSubmitInteraction({ customId: wireCustomIds[1], fields: {}, guildId: null }) as never,
		) as ModalSubmitInteraction;
		await client.components.onModalSubmit(submitted);
		await expect(second).resolves.toBe(submitted);
		expect(submitted.customId).toBe('settings');
		expect(modal.data.custom_id).toBe('settings');
	});

	test('keeps callbacks isolated when a modal builder is opened concurrently', async () => {
		const client = createClient();
		const callback = vi.fn();
		const wireCustomIds: string[] = [];
		const createInteraction = () =>
			BaseInteraction.from(
				client,
				chatInputInteraction({ name: 'profile', guildId: null }) as never,
				async ({ body }: any) => {
					wireCustomIds.push(body.data.custom_id);
				},
			) as Interaction;
		const modal = new Modal().setCustomId('profile').setTitle('Profile').run(callback);

		const first = createInteraction().modal(modal, { waitFor: 1_000 });
		const second = createInteraction().modal(modal, { waitFor: 1_000 });
		await vi.waitFor(() => expect(wireCustomIds).toHaveLength(2));
		const firstSubmit = BaseInteraction.from(
			client,
			modalSubmitInteraction({ customId: wireCustomIds[0], fields: {}, guildId: null }) as never,
		) as ModalSubmitInteraction;
		const secondSubmit = BaseInteraction.from(
			client,
			modalSubmitInteraction({ customId: wireCustomIds[1], fields: {}, guildId: null }) as never,
		) as ModalSubmitInteraction;
		await client.components.onModalSubmit(firstSubmit);
		await client.components.onModalSubmit(secondSubmit);

		await expect(first).resolves.toBe(firstSubmit);
		await expect(second).resolves.toBe(secondSubmit);

		await createInteraction().modal(modal);
		const callbackSubmit = BaseInteraction.from(
			client,
			modalSubmitInteraction({ customId: wireCustomIds[2], fields: {}, guildId: null }) as never,
		) as ModalSubmitInteraction;
		await client.components.onModalSubmit(callbackSubmit);
		expect(callback).toHaveBeenCalledWith(callbackSubmit);
	});
});
