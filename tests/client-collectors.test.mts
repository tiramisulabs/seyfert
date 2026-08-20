import { describe, expect, test, vi } from 'vitest';
import { Client } from '../src/client';
import { Collectors } from '../src/client/collectors';
import type { GatewayDispatchPayload } from '../src/types';

function rawPacket(): GatewayDispatchPayload {
	return {
		op: 0,
		s: 1,
		t: 'READY',
		d: {},
	} as GatewayDispatchPayload;
}

describe('client collectors', () => {
	test('runs camelCase collectors for raw gateway dispatch names', async () => {
		const collectors = new Collectors();
		const packet = rawPacket();
		const run = vi.fn((_packet, stop) => stop('done'));

		collectors.create({
			event: 'raw',
			filter(value) {
				expect(value).toBe(packet);
				return true;
			},
			run,
		});

		await collectors.run('RAW', packet, {} as never);

		expect(run).toHaveBeenCalledWith(packet, expect.any(Function));
		expect(collectors.values.get('raw')).toHaveLength(0);
		expect(collectors.values.has('RAW' as never)).toBe(false);
	});

	test('passes custom-event arguments as a tuple', async () => {
		const client = new Client({ getRC: async () => ({ locations: {} }), plugins: [] } as never);
		const seen: unknown[] = [];
		client.collectors.create({
			event: 'commandsLoaded',
			filter(arg) {
				seen.push(arg);
				return true;
			},
			run: () => {},
		});
		await client.events.runCustom('commandsLoaded', {
			kind: 'commands',
			total: 0,
			items: [],
			plugin: { total: 0, sources: {} },
		});
		expect(seen).toEqual([
			[{ kind: 'commands', total: 0, items: [], plugin: { total: 0, sources: {} } }],
		]);
	});

	test('preserves tuple payloads from gateway event transformers', async () => {
		const collectors = new Collectors();
		const oldUser = { id: 'u1' };
		const seen: unknown[] = [];
		collectors.create({
			event: 'userUpdate',
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
