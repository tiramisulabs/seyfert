import { describe, expect, test, vi } from 'vitest';
import type { ApiHandler } from '../src/api/api';
import { Router } from '../src/api/Router';
import type { UsingClient } from '../src/commands';
import { InvitesShorter } from '../src/common/shorters/invites';

describe('REST route proxy', () => {
	test('combines property and callable segments into one request', async () => {
		const request = vi.fn().mockResolvedValue(undefined);
		const routes = new Router({ request } as unknown as ApiHandler).createProxy();

		await routes.applications('application-id').guilds('guild-id').commands('command-id').permissions.get();

		expect(request).toHaveBeenCalledOnce();
		expect(request).toHaveBeenCalledWith(
			'GET',
			'/applications/application-id/guilds/guild-id/commands/command-id/permissions',
		);
	});

	test('shorters build target user request bodies', async () => {
		const request = vi.fn().mockResolvedValue(undefined);
		const shorter = new InvitesShorter({
			proxy: new Router({ request } as unknown as ApiHandler).createProxy(),
		} as unknown as UsingClient);

		await shorter.addTargetUser('invite-code', 'user-id');
		expect(request).toHaveBeenCalledWith('PUT', '/invites/invite-code/target-users/user-id');

		await shorter.removeTargetUser('invite-code', 'user-id');
		expect(request).toHaveBeenLastCalledWith('DELETE', '/invites/invite-code/target-users/user-id');

		await shorter.bulkAddTargetUsers('invite-code', ['user-1', 'user-2']);
		expect(request).toHaveBeenLastCalledWith('POST', '/invites/invite-code/target-users/bulk-add', {
			body: { user_ids: ['user-1', 'user-2'] },
		});

		await shorter.bulkRemoveTargetUsers('invite-code', ['user-1', 'user-2']);
		expect(request).toHaveBeenLastCalledWith('POST', '/invites/invite-code/target-users/bulk-delete', {
			body: { user_ids: ['user-1', 'user-2'] },
		});
	});
});
