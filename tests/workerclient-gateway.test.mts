import { describe, expect, test, vi } from 'vitest';
import { WorkerClient } from '../src/client/workerclient';
import { GatewayOpcodes } from '../src/types';

describe('WorkerClient gateway sends', () => {
	test('sends through the shard rate limiter without forcing the payload', async () => {
		const send = vi.fn().mockResolvedValue(undefined);
		const client = Object.create(WorkerClient.prototype) as WorkerClient;
		client.shards = new Map([[2, { send } as never]]);
		const payload = { op: GatewayOpcodes.Heartbeat, d: 42 };

		await expect(client.sendGatewayPayload(2, payload)).resolves.toBe(true);
		expect(send).toHaveBeenCalledWith(false, payload);
	});

	test('reports a missing shard', async () => {
		const client = Object.create(WorkerClient.prototype) as WorkerClient;
		client.shards = new Map();

		await expect(client.sendGatewayPayload(9, { op: GatewayOpcodes.Heartbeat, d: null })).rejects.toMatchObject({
			code: 'INTERNAL_ERROR',
			message: 'Internal error.',
			metadata: { detail: "Shard #9 doesn't exist" },
		});
	});
});
