// Compile-time contract for command option inference.
// Locks the readonly fix for `choices` and `channel_types`, plus the documented inference
// across ALL create*Option helpers (with and without a `value`+`ok` callback) so it can't
// silently regress. Checked by `pnpm test:types` against the built `./lib/index.d.ts`.
//
// `choices`/`channel_types` are covered in BOTH forms:
//   • CON `as const` → the fix accepts it and infers the literal value union. Declared as a
//     *separate* const on purpose: the readonly bug only reproduces with a separate
//     `const ... as const` (an inline one is inferred contextually and compiles even without
//     the fix), so these are the cases that turn red if the fix is reverted. Do not inline them.
//   • SIN `as const` → behaves exactly as before the fix: the value type is widened.
import {
	type Attachment,
	ChannelType,
	type CommandContext,
	createAttachmentOption,
	createBooleanOption,
	createChannelOption,
	createIntegerOption,
	createMentionableOption,
	createNumberOption,
	createRoleOption,
	createStringOption,
	createUserOption,
	type GuildMemberStructure,
	type GuildRoleStructure,
	type InteractionGuildMemberStructure,
	type OKFunction,
	type TextGuildChannelStructure,
	type UserStructure,
	type VoiceChannelStructure,
} from 'seyfert';

declare function expectType<T>(value: T): void;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
	? (<T>() => T extends B ? 1 : 2) extends <T>() => T extends A ? 1 : 2
		? true
		: false
	: false;

// Distinct marker type so "the `ok` type flows to ctx.options" is unambiguous for every helper.
interface Resolved {
	rid: string;
}

// ───────────────────────────── choices: con / sin const ─────────────────────────────
const numberChoices = [
	{ name: 'S0', value: 0 },
	{ name: 'S1', value: 1 },
	{ name: 'S1.5', value: 1.5 },
] as const;
const stringChoices = [
	{ name: 'Solo', value: 'solo' },
	{ name: 'Duo', value: 'duo' },
] as const;
const integerChoices = [
	{ name: 'D6', value: 6 },
	{ name: 'D20', value: 20 },
] as const;
const abChoices = [
	{ name: 'A', value: 'a' },
	{ name: 'B', value: 'b' },
] as const;

const choiceOptions = {
	numberConst: createNumberOption({ description: 'n', required: true, choices: numberChoices }),
	numberMutable: createNumberOption({
		description: 'n',
		required: true,
		choices: [
			{ name: 'S0', value: 0 },
			{ name: 'S1', value: 1 },
			{ name: 'S1.5', value: 1.5 },
		],
	}),
	numberConstOptional: createNumberOption({ description: 'n', choices: numberChoices }),
	stringConst: createStringOption({ description: 's', required: true, choices: stringChoices }),
	stringMutable: createStringOption({
		description: 's',
		required: true,
		choices: [
			{ name: 'Solo', value: 'solo' },
			{ name: 'Duo', value: 'duo' },
		],
	}),
	integerConst: createIntegerOption({ description: 'i', required: true, choices: integerChoices }),
	integerMutable: createIntegerOption({
		description: 'i',
		required: true,
		choices: [
			{ name: 'D6', value: 6 },
			{ name: 'D20', value: 20 },
		],
	}),
	// value callback: `data.value` from choices (CON const: literal | SIN const: widened),
	// `ctx.options` from `ok`.
	resolvedConst: createStringOption({
		description: 'r',
		required: true,
		choices: abChoices,
		value(data, ok: OKFunction<number>) {
			expectType<true>(true as Equal<typeof data.value, 'a' | 'b'>);
			ok(1);
		},
	}),
	resolvedMutable: createStringOption({
		description: 'r',
		required: true,
		choices: [
			{ name: 'A', value: 'a' },
			{ name: 'B', value: 'b' },
		],
		value(data, ok: OKFunction<number>) {
			expectType<true>(true as Equal<typeof data.value, string>);
			ok(1);
		},
	}),
} as const;

declare const choiceCtx: CommandContext<typeof choiceOptions>;
expectType<true>(true as Equal<typeof choiceCtx.options.numberConst, 0 | 1 | 1.5>);
expectType<true>(true as Equal<typeof choiceCtx.options.numberMutable, number>);
expectType<true>(true as Equal<typeof choiceCtx.options.numberConstOptional, 0 | 1 | 1.5 | undefined>);
expectType<true>(true as Equal<typeof choiceCtx.options.stringConst, 'solo' | 'duo'>);
expectType<true>(true as Equal<typeof choiceCtx.options.stringMutable, string>);
expectType<true>(true as Equal<typeof choiceCtx.options.integerConst, 6 | 20>);
expectType<true>(true as Equal<typeof choiceCtx.options.integerMutable, number>);
expectType<true>(true as Equal<typeof choiceCtx.options.resolvedConst, number>);
expectType<true>(true as Equal<typeof choiceCtx.options.resolvedMutable, number>);

// @ts-expect-error a number option rejects string choice values
createNumberOption({ description: 'x', choices: [{ name: 'a', value: 'not-a-number' }] });
// @ts-expect-error a string option rejects numeric choice values
createStringOption({ description: 'x', choices: [{ name: 'a', value: 1 }] });

// ─────────────────────────── channel_types: con / sin const ───────────────────────────
const channelTypesOne = [ChannelType.GuildText] as const;
const channelTypesMany = [ChannelType.GuildText, ChannelType.GuildVoice] as const;

const channelOptions = {
	constOne: createChannelOption({ description: 'c', required: true, channel_types: channelTypesOne }),
	constMany: createChannelOption({ description: 'c', required: true, channel_types: channelTypesMany }),
	mutableOne: createChannelOption({ description: 'c', required: true, channel_types: [ChannelType.GuildText] }),
	mutableMany: createChannelOption({
		description: 'c',
		required: true,
		channel_types: [ChannelType.GuildText, ChannelType.GuildVoice],
	}),
} as const;

declare const channelCtx: CommandContext<typeof channelOptions>;
expectType<true>(true as Equal<typeof channelCtx.options.constOne, TextGuildChannelStructure>);
expectType<true>(
	true as Equal<typeof channelCtx.options.constMany, TextGuildChannelStructure | VoiceChannelStructure>,
);
expectType<true>(true as Equal<typeof channelCtx.options.mutableOne, TextGuildChannelStructure>);
expectType<true>(
	true as Equal<typeof channelCtx.options.mutableMany, TextGuildChannelStructure | VoiceChannelStructure>,
);

// ───────────── every create*Option — SIN callback (tipo base) ─────────────
const withoutCallback = {
	string: createStringOption({ description: 'x', required: true }),
	integer: createIntegerOption({ description: 'x', required: true }),
	number: createNumberOption({ description: 'x', required: true }),
	boolean: createBooleanOption({ description: 'x', required: true }),
	user: createUserOption({ description: 'x', required: true }),
	role: createRoleOption({ description: 'x', required: true }),
	mentionable: createMentionableOption({ description: 'x', required: true }),
	attachment: createAttachmentOption({ description: 'x', required: true }),
	channel: createChannelOption({ description: 'x', required: true, channel_types: [ChannelType.GuildText] }),
} as const;

declare const baseCtx: CommandContext<typeof withoutCallback>;
expectType<true>(true as Equal<typeof baseCtx.options.string, string>);
expectType<true>(true as Equal<typeof baseCtx.options.integer, number>);
expectType<true>(true as Equal<typeof baseCtx.options.number, number>);
expectType<true>(true as Equal<typeof baseCtx.options.boolean, boolean>);
expectType<true>(true as Equal<typeof baseCtx.options.user, InteractionGuildMemberStructure | UserStructure>);
expectType<true>(true as Equal<typeof baseCtx.options.role, GuildRoleStructure>);
expectType<true>(
	true as Equal<
		typeof baseCtx.options.mentionable,
		GuildRoleStructure | InteractionGuildMemberStructure | GuildMemberStructure | UserStructure
	>,
);
expectType<true>(true as Equal<typeof baseCtx.options.attachment, Attachment>);
expectType<true>(true as Equal<typeof baseCtx.options.channel, TextGuildChannelStructure>);

// ───────────── every create*Option — CON callback `value` + `ok` ─────────────
// `data.value` receives the option's input type; `ok: OKFunction<Resolved>` makes ctx.options `Resolved`.
const withCallback = {
	string: createStringOption({
		description: 'x',
		required: true,
		value(data, ok: OKFunction<Resolved>) {
			expectType<true>(true as Equal<typeof data.value, string>);
			ok({ rid: '1' });
		},
	}),
	integer: createIntegerOption({
		description: 'x',
		required: true,
		value(data, ok: OKFunction<Resolved>) {
			expectType<true>(true as Equal<typeof data.value, number>);
			ok({ rid: '1' });
		},
	}),
	number: createNumberOption({
		description: 'x',
		required: true,
		value(data, ok: OKFunction<Resolved>) {
			expectType<true>(true as Equal<typeof data.value, number>);
			ok({ rid: '1' });
		},
	}),
	boolean: createBooleanOption({
		description: 'x',
		required: true,
		value(data, ok: OKFunction<Resolved>) {
			expectType<true>(true as Equal<typeof data.value, boolean>);
			ok({ rid: '1' });
		},
	}),
	user: createUserOption({
		description: 'x',
		required: true,
		value(data, ok: OKFunction<Resolved>) {
			expectType<true>(true as Equal<typeof data.value, InteractionGuildMemberStructure | UserStructure>);
			ok({ rid: '1' });
		},
	}),
	role: createRoleOption({
		description: 'x',
		required: true,
		value(data, ok: OKFunction<Resolved>) {
			expectType<true>(true as Equal<typeof data.value, GuildRoleStructure>);
			ok({ rid: '1' });
		},
	}),
	mentionable: createMentionableOption({
		description: 'x',
		required: true,
		value(data, ok: OKFunction<Resolved>) {
			expectType<true>(
				true as Equal<
					typeof data.value,
					GuildRoleStructure | InteractionGuildMemberStructure | GuildMemberStructure | UserStructure
				>,
			);
			ok({ rid: '1' });
		},
	}),
	attachment: createAttachmentOption({
		description: 'x',
		required: true,
		value(data, ok: OKFunction<Resolved>) {
			expectType<true>(true as Equal<typeof data.value, Attachment>);
			ok({ rid: '1' });
		},
	}),
	channel: createChannelOption({
		description: 'x',
		required: true,
		channel_types: [ChannelType.GuildText],
		value(data, ok: OKFunction<Resolved>) {
			expectType<true>(true as Equal<typeof data.value, TextGuildChannelStructure>);
			ok({ rid: '1' });
		},
	}),
} as const;

declare const cbCtx: CommandContext<typeof withCallback>;
expectType<true>(true as Equal<typeof cbCtx.options.string, Resolved>);
expectType<true>(true as Equal<typeof cbCtx.options.integer, Resolved>);
expectType<true>(true as Equal<typeof cbCtx.options.number, Resolved>);
expectType<true>(true as Equal<typeof cbCtx.options.boolean, Resolved>);
expectType<true>(true as Equal<typeof cbCtx.options.user, Resolved>);
expectType<true>(true as Equal<typeof cbCtx.options.role, Resolved>);
expectType<true>(true as Equal<typeof cbCtx.options.mentionable, Resolved>);
expectType<true>(true as Equal<typeof cbCtx.options.attachment, Resolved>);
expectType<true>(true as Equal<typeof cbCtx.options.channel, Resolved>);
