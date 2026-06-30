// Exhaustive power set: EVERY combination of the 9 optional slash-command `@Declare`
// properties (2^9 = 512). For each combination we assert BOTH directions:
//   1. a lowercase `name` MUST compile  -> proves the property values are valid, so the
//      uppercase failure below can only come from the name (no false-positive @ts-expect-error).
//   2. an uppercase `name` MUST be rejected (`// @ts-expect-error`) -> the lowercase check stays
//      active no matter which properties are present. A directive that stops erroring => regression.
//
// Locks the readonly fix for `aliases`/`guildId` against EVERY property combination. Checked by
// `pnpm test:types` against the built `./lib/index.d.ts`. Keep each `Declare(...)` on one line.

import { Declare, IgnoreCommand } from 'seyfert';

const aliasesConst = ['p', 'pong'] as const;
const guildIdConst = ['1', '2'] as const;

Declare({ name: 'xx', description: 'x' });
// @ts-expect-error uppercase rejected with: (none)
Declare({ name: 'Xx', description: 'x' });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'] });
// @ts-expect-error uppercase rejected with: botPermissions
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'] });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst });
// @ts-expect-error uppercase rejected with: guildId
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst });
Declare({ name: 'xx', description: 'x', nsfw: true });
// @ts-expect-error uppercase rejected with: nsfw
Declare({ name: 'Xx', description: 'x', nsfw: true });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true });
// @ts-expect-error uppercase rejected with: guildId+nsfw
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: integrationTypes
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'] });
Declare({ name: 'xx', description: 'x', contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: contexts
Declare({ name: 'Xx', description: 'x', contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+contexts
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: guildId+contexts
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+contexts
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', nsfw: true, contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: nsfw+contexts
Declare({ name: 'Xx', description: 'x', nsfw: true, contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+contexts
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: guildId+nsfw+contexts
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+contexts
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'] });
Declare({ name: 'xx', description: 'x', ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: ignore
Declare({ name: 'Xx', description: 'x', ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: guildId+ignore
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', nsfw: true, ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: nsfw+ignore
Declare({ name: 'Xx', description: 'x', nsfw: true, ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: guildId+nsfw+ignore
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: contexts+ignore
Declare({ name: 'Xx', description: 'x', contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+contexts+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: guildId+contexts+ignore
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+contexts+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: nsfw+contexts+ignore
Declare({ name: 'Xx', description: 'x', nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+contexts+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: guildId+nsfw+contexts+ignore
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+contexts+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+ignore
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash });
Declare({ name: 'xx', description: 'x', aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: aliases
Declare({ name: 'Xx', description: 'x', aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', nsfw: true, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: nsfw+aliases
Declare({ name: 'Xx', description: 'x', nsfw: true, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+nsfw+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: contexts+aliases
Declare({ name: 'Xx', description: 'x', contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+contexts+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+contexts+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+contexts+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: nsfw+contexts+aliases
Declare({ name: 'Xx', description: 'x', nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+contexts+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+nsfw+contexts+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+contexts+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: ignore+aliases
Declare({ name: 'Xx', description: 'x', ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+ignore+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: nsfw+ignore+aliases
Declare({ name: 'Xx', description: 'x', nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+nsfw+ignore+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: nsfw+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+nsfw+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+ignore+aliases
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst });
Declare({ name: 'xx', description: 'x', props: {} });
// @ts-expect-error uppercase rejected with: props
Declare({ name: 'Xx', description: 'x', props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+props
Declare({ name: 'Xx', description: 'x', nsfw: true, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, props: {} });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: integrationTypes+props
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+props
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], props: {} });
Declare({ name: 'xx', description: 'x', contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: contexts+props
Declare({ name: 'Xx', description: 'x', contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+contexts+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: guildId+contexts+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+contexts+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: nsfw+contexts+props
Declare({ name: 'Xx', description: 'x', nsfw: true, contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+contexts+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+contexts+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+contexts+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], props: {} });
Declare({ name: 'xx', description: 'x', ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: ignore+props
Declare({ name: 'Xx', description: 'x', ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: guildId+ignore+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+ignore+props
Declare({ name: 'Xx', description: 'x', nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+ignore+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: contexts+ignore+props
Declare({ name: 'Xx', description: 'x', contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: guildId+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+ignore+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, props: {} });
Declare({ name: 'xx', description: 'x', aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: aliases+props
Declare({ name: 'Xx', description: 'x', aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+aliases+props
Declare({ name: 'Xx', description: 'x', nsfw: true, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: contexts+aliases+props
Declare({ name: 'Xx', description: 'x', contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: ignore+aliases+props
Declare({ name: 'Xx', description: 'x', ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: nsfw+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+nsfw+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+nsfw+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+nsfw+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: guildId+nsfw+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+guildId+nsfw+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
Declare({ name: 'xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
// @ts-expect-error uppercase rejected with: botPermissions+defaultMemberPermissions+guildId+nsfw+integrationTypes+contexts+ignore+aliases+props
Declare({ name: 'Xx', description: 'x', botPermissions: ['ManageGuild'], defaultMemberPermissions: ['Administrator'], guildId: guildIdConst, nsfw: true, integrationTypes: ['GuildInstall'], contexts: ['Guild'], ignore: IgnoreCommand.Slash, aliases: aliasesConst, props: {} });
