import {
  ApplicationCommandType,
  PermissionFlagsBits,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from '@biscuitland/common';
import { AllSlashOptions, SlashSubcommandGroupOption, SlashSubcommandOption } from './SlashCommandOption';
import { PermissionsStrings } from '../../Utils';
import { Mixin } from 'ts-mixer';

class SlashCommandB {
  constructor(public data: Partial<RESTPostAPIChatInputApplicationCommandsJSONBody> = {}) {}

  setDMPermission(value = true): this {
    this.data.dm_permission = value;
    return this;
  }

  setNSFW(value = true): this {
    this.data.nsfw = value;
    return this;
  }

  setDefautlMemberPermissions(permissions: PermissionsStrings[]): this {
    this.data.default_member_permissions = `$${permissions.reduce((y, x) => y | PermissionFlagsBits[x], 0n)}`;
    return this;
  }

  addSubcommandGroup(fn: (option: SlashSubcommandGroupOption) => SlashSubcommandGroupOption): this {
    const option = fn(new SlashSubcommandGroupOption());
    this.addRawOption(option.toJSON());
    return this;
  }

  addSubcommand(fn: (option: SlashSubcommandOption) => SlashSubcommandOption): this {
    const option = fn(new SlashSubcommandOption());
    this.addRawOption(option.toJSON());
    return this;
  }

  addRawOption(option: ReturnType<AllSlashOptions['toJSON']>) {
    this.data.options ??= [];
    // @ts-expect-error discord-api-types bad typing, again
    this.data.options.push(option);
  }

  toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody {
    return {
      ...this.data,
      type: ApplicationCommandType.ChatInput
    } as RESTPostAPIChatInputApplicationCommandsJSONBody & {
      type: ApplicationCommandType.ChatInput;
    };
  }
}

export const SlashCommand = Mixin(SlashCommandB, SlashSubcommandOption);
export type SlashCommand = InstanceType<typeof SlashCommand>;
