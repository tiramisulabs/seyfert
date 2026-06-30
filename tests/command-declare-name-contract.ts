// Compile-time contract: `@Declare` MUST reject a non-lowercase command `name` for
// chat-input (slash) and entry-point commands, and that rejection MUST survive the presence
// of `aliases` / `guildId`. Checked by `pnpm test:types` against the built `./lib/index.d.ts`.
//
// Why this exists (regression lock):
//   `CommandDeclareOptions` is a union, and `aliases`/`guildId` used to be mutable `string[]`.
//   Under `Declare<const T>` inference a supplied `aliases`/`guildId` is inferred as a
//   `readonly` tuple, which is NOT assignable to a mutable `string[]` in any union member, so
//   TS abandons the literal inference and widens the whole object — turning `name` into
//   `string` and silently disabling the `LowercaseDeclareName` check. Result: any command with
//   `aliases`/`guildId` lost uppercase validation. The fix types those props as
//   `readonly string[]`. A `// @ts-expect-error` below that STOPS erroring => the fix regressed.
//
// Notes:
//   - Context-menu (User/Message) names are intentionally case-preserving and must NOT be rejected.
//   - Keep every `Declare(...)` on a SINGLE line so a `// @ts-expect-error` targets the line
//     that carries the `name` error (a multi-line object would put the error on the `name:` row).

import { ApplicationCommandType, Declare, EntryPointCommandHandlerType } from 'seyfert';

// Separate `as const` arrays: the strongest reproduction — an inline literal is inferred
// contextually and used to compile even without the fix; a separate `as const` does not.
const aliasesConst = ['p', 'pong'] as const;
const guildIdConst = ['1', '2'] as const;

// ───────────────────────── slash: lowercase ACCEPTED ─────────────────────────
Declare({ name: 'ping', description: 'x' });
Declare({ name: 'ping', description: 'x', aliases: ['p'] });
Declare({ name: 'ping', description: 'x', guildId: ['1'] });
Declare({ name: 'ping', description: 'x', aliases: ['p'], guildId: ['1'] });
Declare({ name: 'my-command_2', description: 'x', aliases: ['mc'] });
Declare({ name: 'ping', description: 'x', aliases: aliasesConst });
Declare({ name: 'ping', description: 'x', guildId: guildIdConst });

// ───────────────────────── slash: uppercase REJECTED ─────────────────────────
// @ts-expect-error uppercase slash name must be rejected (baseline, no extra props)
Declare({ name: 'Ping', description: 'x' });
// @ts-expect-error uppercase slash name must be rejected WITH aliases (regression case)
Declare({ name: 'Ping', description: 'x', aliases: ['p'] });
// @ts-expect-error uppercase slash name must be rejected WITH guildId (regression case)
Declare({ name: 'Ping', description: 'x', guildId: ['1'] });
// @ts-expect-error uppercase slash name must be rejected WITH aliases + guildId
Declare({ name: 'Ping', description: 'x', aliases: ['p'], guildId: ['1'] });
// @ts-expect-error mixed-case slash name must be rejected WITH aliases
Declare({ name: 'myCommand', description: 'x', aliases: ['mc'] });
// @ts-expect-error uppercase slash name must be rejected WITH aliases as a separate `as const`
Declare({ name: 'Ping', description: 'x', aliases: aliasesConst });
// @ts-expect-error uppercase slash name must be rejected WITH guildId as a separate `as const`
Declare({ name: 'Ping', description: 'x', guildId: guildIdConst });

// ───────────── context-menu (User/Message): case PRESERVED, not rejected ─────────────
Declare({ name: 'My User Menu', type: ApplicationCommandType.User });
Declare({ name: 'My Message Menu', type: ApplicationCommandType.Message });
Declare({ name: 'My User Menu', type: ApplicationCommandType.User, aliases: ['m'] });
Declare({ name: 'My User Menu', type: ApplicationCommandType.User, guildId: guildIdConst });

// ───────────────────────── entry-point: lowercase rule applies ─────────────────────────
Declare({ name: 'launch', description: 'x', type: ApplicationCommandType.PrimaryEntryPoint, handler: EntryPointCommandHandlerType.AppHandler });
// @ts-expect-error uppercase entry-point name must be rejected
Declare({ name: 'Launch', description: 'x', type: ApplicationCommandType.PrimaryEntryPoint, handler: EntryPointCommandHandlerType.AppHandler });
