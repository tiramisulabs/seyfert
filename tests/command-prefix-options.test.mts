import { describe, expect, test, vi } from 'vitest';
import { Command } from '../src/commands';
import { type CommandOptionWithType, HandleCommand } from '../src/commands/handle';
import { ApplicationCommandOptionType, type GatewayMessageCreateDispatchData } from '../src/types';

function createResolvedOptions() {
	return {
		attachments: {},
		channels: {},
		members: {},
		roles: {},
		users: {},
	};
}

function createMessage(overrides: Record<string, unknown> = {}) {
	return {
		attachments: [],
		content: '',
		mention_roles: [],
		mentions: [],
		...overrides,
	} as unknown as GatewayMessageCreateDispatchData;
}

function createCommand(options: Record<string, unknown>[]) {
	const command = new Command();
	command.options = options as never;
	return command;
}

class TrackingHandleCommand extends HandleCommand {
	constructor(
		client: ConstructorParameters<typeof HandleCommand>[0],
		private readonly calls: string[],
	) {
		super(client);
	}

	override fetchRole(_option: CommandOptionWithType, query: string, guildId?: string) {
		this.calls.push(`fetch-role:${query}:${guildId}`);
		return Promise.resolve({ id: query } as never);
	}

	override fetchUser(_option: CommandOptionWithType, query: string) {
		this.calls.push(`fetch-user:${query}`);
		return Promise.resolve({ id: query } as never);
	}

	override fetchMember(_option: CommandOptionWithType, query: string, guildId: string) {
		this.calls.push(`fetch-member:${query}:${guildId}`);
		return Promise.resolve({ user: { id: query } } as never);
	}
}

describe('prefix command option parsing', () => {
	test('preserves option and error order with exact validation diagnostics', async () => {
		const handle = new HandleCommand({} as never);
		const command = createCommand([
			{
				name: 'text',
				type: ApplicationCommandOptionType.String,
				required: true,
				min_length: 4,
			},
			{ name: 'enabled', type: ApplicationCommandOptionType.Boolean },
			{ name: 'count', type: ApplicationCommandOptionType.Integer, required: true },
			{ name: 'file', type: ApplicationCommandOptionType.Attachment },
			{ name: 'ratio', type: ApplicationCommandOptionType.Number },
		]);
		const attachment = { id: 'attachment-1', filename: 'one.txt', size: 1, url: 'https://example.com/one.txt' };
		const resolved = createResolvedOptions();

		const result = await handle.argsOptionsParser(
			command,
			createMessage({ attachments: [attachment] }),
			{ count: 'not-a-number', enabled: 'yes', ratio: '1.5', text: 'abc' },
			resolved,
		);

		expect(result.options).toEqual([
			{ name: 'enabled', type: ApplicationCommandOptionType.Boolean, value: true },
			{ name: 'file', type: ApplicationCommandOptionType.Attachment, value: 'attachment-1' },
			{ name: 'ratio', type: ApplicationCommandOptionType.Number, value: 1.5 },
		]);
		expect(result.errors).toEqual([
			{
				name: 'text',
				error: 'The entered string has less than 4 characters. The minimum required is 4 characters',
				fullError: ['STRING_MIN_LENGTH', 4],
			},
			{
				name: 'count',
				error: 'The entered choice is an invalid number',
				fullError: ['NUMBER_NAN', 'not-a-number'],
			},
		]);
		expect(resolved.attachments).toEqual({ 'attachment-1': attachment });
	});

	test('keeps resource resolution cache-first before invoking fetch hooks', async () => {
		const roleId = '12345678901234567';
		const userId = '12345678901234568';
		const calls: string[] = [];
		const client = {
			cache: {
				members: {
					raw: vi.fn(() => {
						calls.push(`cache-member:${userId}:guild-1`);
					}),
				},
				roles: {
					raw: vi.fn(() => {
						calls.push(`cache-role:${roleId}`);
					}),
				},
				users: {
					raw: vi.fn(() => {
						calls.push(`cache-user:${userId}`);
					}),
				},
			},
		};
		const handle = new TrackingHandleCommand(client as never, calls);
		const command = createCommand([
			{ name: 'role', type: ApplicationCommandOptionType.Role },
			{ name: 'user', type: ApplicationCommandOptionType.User },
		]);
		const resolved = createResolvedOptions();

		const result = await handle.argsOptionsParser(
			command,
			createMessage({ guild_id: 'guild-1' }),
			{ role: roleId, user: userId },
			resolved,
		);

		expect(calls).toEqual([
			`cache-role:${roleId}`,
			`fetch-role:${roleId}:guild-1`,
			`cache-user:${userId}`,
			`fetch-user:${userId}`,
			`cache-member:${userId}:guild-1`,
			`fetch-member:${userId}:guild-1`,
		]);
		expect(result.errors).toEqual([]);
		expect(result.options).toEqual([
			{ name: 'role', type: ApplicationCommandOptionType.Role, value: roleId },
			{ name: 'user', type: ApplicationCommandOptionType.User, value: userId },
		]);
		expect(resolved.roles).toEqual({ [roleId]: { id: roleId } });
		expect(resolved.users).toEqual({ [userId]: { id: userId } });
		expect(resolved.members).toEqual({ [userId]: { user: { id: userId } } });
	});
});
