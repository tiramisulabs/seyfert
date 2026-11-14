import { describe, expect, test } from 'vitest';
import { User } from '../src/structures';

function createUser(data: { username: string; discriminator: string; global_name?: string | null }) {
	return new User({} as never, { id: '100000000000000001', avatar: null, ...data } as never);
}

describe('User.tag', () => {
	test('omits the discriminator for users migrated to the unique username system', () => {
		expect(createUser({ username: 'pepe', discriminator: '0' }).tag).toBe('pepe');
	});

	test('keeps the discriminator for legacy accounts', () => {
		expect(createUser({ username: 'pepe', discriminator: '1234' }).tag).toBe('pepe#1234');
	});

	test('prefers the global name when the user has one', () => {
		expect(createUser({ username: 'pepe', discriminator: '0', global_name: 'Pepe' }).tag).toBe('Pepe');
	});
});
