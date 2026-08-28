import { describe, expect, test } from 'vitest';
import { Collectors } from '../src/client/collectors';

declare module '../src/events/event' {
	interface CustomEvents {
		backportEvent(value: { kind: string }): void;
	}
}

describe('client collectors', () => {
	test('passes custom-event arguments as a tuple', async () => {
		const collectors = new Collectors();
		const seen: unknown[] = [];
		collectors.create({
			event: 'backportEvent',
			filter(value) {
				seen.push(value);
				return true;
			},
			run: () => {},
		});

		await collectors.run('backportEvent', [{ kind: 'custom' }], {} as never);

		expect(seen).toEqual([[{ kind: 'custom' }]]);
	});

	test('preserves tuple payloads from gateway event transformers', async () => {
		const collectors = new Collectors();
		const oldUser = { id: 'u1' };
		const seen: unknown[] = [];
		collectors.create({
			event: 'USER_UPDATE',
			filter(value) {
				seen.push(value);
				return true;
			},
			run: () => {},
		});
		await collectors.run(
			'USER_UPDATE',
			{ id: 'u1', username: 'updated', discriminator: '0', avatar: null } as never,
			{ cache: { users: { get: async () => oldUser } } } as never,
		);

		expect(seen).toEqual([[expect.objectContaining({ id: 'u1', username: 'updated' }), oldUser]]);
	});
});
