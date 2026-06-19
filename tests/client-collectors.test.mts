import { describe, expect, test, vi } from 'vitest';
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
});
