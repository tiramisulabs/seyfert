import {
  APIApplicationCommandAttachmentOption,
  APIApplicationCommandBooleanOption,
  APIApplicationCommandChannelOption,
  APIApplicationCommandIntegerOption as AACIO,
  APIApplicationCommandMentionableOption,
  APIApplicationCommandNumberOption as AACNO,
  APIApplicationCommandOption,
  APIApplicationCommandOptionBase,
  APIApplicationCommandOptionChoice,
  APIApplicationCommandRoleOption,
  APIApplicationCommandStringOption as AACSO,
  APIApplicationCommandSubcommandGroupOption as AACSGO,
  APIApplicationCommandSubcommandOption as AACSCO,
  APIApplicationCommandUserOption,
  ApplicationCommandOptionType,
  ChannelType,
  LocalizationMap,
  RestToKeys,
  TypeArray,
  When
} from '@biscuitland/common';
import { OptionValuesLength } from '../../';

export type SlashBaseOptionTypes =
  | Exclude<APIApplicationCommandOption, AACSO | AACNO | AACIO | AACSCO>
  | APIApplicationCommandStringOption
  | APIApplicationCommandNumberOption
  | APIApplicationCommandIntegerOption
  | APIApplicationCommandSubcommandOption;

export type ApplicationCommandBasicOptions =
  | APIApplicationCommandAttachmentOption
  | APIApplicationCommandChannelOption
  | APIApplicationCommandIntegerOption
  | APIApplicationCommandMentionableOption
  | APIApplicationCommandNumberOption
  | APIApplicationCommandStringOption
  | APIApplicationCommandRoleOption
  | APIApplicationCommandBooleanOption
  | APIApplicationCommandUserOption;

export abstract class SlashBaseOption<DataType extends SlashBaseOptionTypes> {
  constructor(public data: Partial<DataType> = {}) {}

  setName(name: string): this {
    this.data.name = name;
    return this;
  }

  setDesciption(desc: string): this {
    this.data.description = desc;
    return this;
  }

  addLocalizations(locals: RestToKeys<[LocalizationMap, 'name', 'description']>): this {
    this.data.name_localizations = locals.name;
    this.data.description_localizations = locals.description;
    return this;
  }

  toJSON(): DataType {
    return { ...this.data } as DataType;
  }
}

export type SlashRequiredOptionTypes = Exclude<SlashBaseOptionTypes, AACSGO | AACSGO>;

export class SlashRequiredOption<DataType extends SlashRequiredOptionTypes> extends SlashBaseOption<DataType> {
  setRequired(required = true): this {
    this.data.required = required;
    return this;
  }
}

/**
 * Temporal fix type
 * I didn't find the correct way to set this with discord-api-types
 * Author: socram03
 */
export interface APIApplicationCommandStringOption<AC extends boolean = boolean>
  extends APIApplicationCommandOptionBase<ApplicationCommandOptionType.String> {
  /**
   * For option type `STRING`, the minimum allowed length (minimum of `0`, maximum of `6000`).
   */
  min_length?: number;
  /**
   * For option type `STRING`, the maximum allowed length (minimum of `1`, maximum of `6000`).
   */
  max_length?: number;

  autocomplete: When<AC, false | undefined, true>;

  choices: When<AC, APIApplicationCommandOptionChoice<string>[], never>;
}

export class SlashStringOption<AC extends boolean = boolean> extends SlashRequiredOption<APIApplicationCommandStringOption<AC>> {
  constructor(data: Partial<APIApplicationCommandStringOption<AC>> = {}) {
    super({ ...data, type: ApplicationCommandOptionType.String });
  }

  addChoices(choices: TypeArray<APIApplicationCommandOptionChoice<string>>): SlashStringOption<true> {
    const ctx = this as SlashStringOption<true>;
    ctx.data.choices ??= [];
    ctx.data.choices = ctx.data.choices!.concat(choices);
    return ctx;
  }

  setAutocomplete(auto = true): SlashStringOption<typeof auto> {
    const ctx = this as SlashStringOption<typeof auto>;
    ctx.data.autocomplete = auto;
    return ctx;
  }

  setLength({ min, max }: OptionValuesLength): this {
    this.data.min_length = min;
    this.data.max_length = max;
    return this;
  }
}

/**
 * Temporal fix type
 * I didn't find the correct way to set this with discord-api-types
 * Author: socram03
 */
interface APIApplicationCommandNumberOption<AC extends boolean = boolean>
  extends APIApplicationCommandOptionBase<ApplicationCommandOptionType.Number> {
  /**
   * If the option is an `INTEGER` or `NUMBER` type, the minimum value permitted.
   */
  min_value?: number;
  /**
   * If the option is an `INTEGER` or `NUMBER` type, the maximum value permitted.
   */
  max_value?: number;

  autocomplete: When<AC, false | undefined, true>;

  choices: When<AC, APIApplicationCommandOptionChoice<number>[], never>;
}

export class SlashNumberOption<AC extends boolean = boolean> extends SlashRequiredOption<APIApplicationCommandNumberOption<AC>> {
  constructor(data: Partial<APIApplicationCommandNumberOption<AC>> = {}) {
    super({ ...data, type: ApplicationCommandOptionType.Number });
  }

  addChoices(choices: TypeArray<APIApplicationCommandOptionChoice<number>>): SlashNumberOption<true> {
    const ctx = this as SlashNumberOption<true>;
    ctx.data.choices ??= [];
    ctx.data.choices = ctx.data.choices.concat(choices);
    return ctx;
  }

  setValueRange({ min, max }: OptionValuesLength): this {
    this.data.max_value = max;
    this.data.min_value = min;
    return this;
  }

  setAutocomplete(auto = true): SlashNumberOption<typeof auto> {
    const ctx = this as SlashNumberOption<typeof auto>;
    ctx.data.autocomplete = auto;
    return ctx;
  }
}

/**
 * Temporal fix type
 * I didn't find the correct way to set this with discord-api-types
 * Author: socram03
 */
interface APIApplicationCommandIntegerOption<AC extends boolean = boolean>
  extends APIApplicationCommandOptionBase<ApplicationCommandOptionType.Integer> {
  /**
   * If the option is an `INTEGER` or `NUMBER` type, the minimum value permitted.
   */
  min_value?: number;
  /**
   * If the option is an `INTEGER` or `NUMBER` type, the maximum value permitted.
   */
  max_value?: number;

  autocomplete: When<AC, false | undefined, true>;

  choices: When<AC, APIApplicationCommandOptionChoice<number>[], never>;
}

export class SlashIntegerOption<AC extends boolean = boolean> extends SlashRequiredOption<APIApplicationCommandIntegerOption<AC>> {
  constructor(data: Partial<APIApplicationCommandIntegerOption<AC>> = {}) {
    super({ ...data, type: ApplicationCommandOptionType.Integer });
  }
}

export class SlashUserOption extends SlashRequiredOption<APIApplicationCommandUserOption> {
  constructor(data: Partial<APIApplicationCommandUserOption> = {}) {
    super({ ...data, type: ApplicationCommandOptionType.User });
  }
}

export type SlashChannelOptionChannelTypes = Exclude<ChannelType, ChannelType.DM | ChannelType.GroupDM>;

export class SlashChannelOption extends SlashRequiredOption<APIApplicationCommandChannelOption> {
  constructor(data: Partial<APIApplicationCommandChannelOption> = {}) {
    super({ ...data, type: ApplicationCommandOptionType.Channel });
  }

  setChannelTypes(types: SlashChannelOptionChannelTypes[]): this {
    this.data.channel_types = types;
    return this;
  }
}

export class SlashRoleOption extends SlashRequiredOption<APIApplicationCommandRoleOption> {
  constructor(data: Partial<APIApplicationCommandRoleOption> = {}) {
    super({ ...data, type: ApplicationCommandOptionType.Role });
  }
}

export class SlashMentionableOption extends SlashRequiredOption<APIApplicationCommandMentionableOption> {
  constructor(data: Partial<APIApplicationCommandMentionableOption> = {}) {
    super({ ...data, type: ApplicationCommandOptionType.Mentionable });
  }
}

export class SlashAttachmentOption extends SlashRequiredOption<APIApplicationCommandAttachmentOption> {
  constructor(data: Partial<APIApplicationCommandAttachmentOption> = {}) {
    super({ ...data, type: ApplicationCommandOptionType.Attachment });
  }
}

export class SlashBooleanOption extends SlashRequiredOption<APIApplicationCommandBooleanOption> {
  constructor(data: Partial<APIApplicationCommandBooleanOption> = {}) {
    super({ ...data, type: ApplicationCommandOptionType.Boolean });
  }
}

export type BasicSlashOptions =
  | SlashStringOption
  | SlashAttachmentOption
  | SlashChannelOption
  | SlashIntegerOption
  | SlashNumberOption
  | SlashRoleOption
  | SlashMentionableOption
  | SlashUserOption
  | SlashBooleanOption;

export type APIApplicationCommandSubcommandOption = AACSCO & {
  options?: ApplicationCommandBasicOptions[];
};

export class SlashSubcommandOption extends SlashBaseOption<APIApplicationCommandSubcommandOption> {
  constructor(data: Partial<APIApplicationCommandSubcommandOption> = {}) {
    super({ ...data, type: ApplicationCommandOptionType.Subcommand });
  }

  addStringOption(fn: (option: SlashStringOption) => SlashStringOption): this {
    const option = fn(new SlashStringOption());
    this.addRawOption(option.toJSON());
    return this;
  }

  addNumberOption(fn: (option: SlashNumberOption) => SlashNumberOption): this {
    const option = fn(new SlashNumberOption());
    this.addRawOption(option.toJSON());
    return this;
  }

  addIntegerOption(fn: (option: SlashIntegerOption) => SlashIntegerOption): this {
    const option = fn(new SlashIntegerOption());
    this.addRawOption(option.toJSON());
    return this;
  }

  addChannelOption(fn: (option: SlashChannelOption) => SlashChannelOption): this {
    const option = fn(new SlashChannelOption());
    this.addRawOption(option.toJSON());
    return this;
  }

  addUserOption(fn: (option: SlashUserOption) => SlashUserOption): this {
    const option = fn(new SlashUserOption());
    this.addRawOption(option.toJSON());
    return this;
  }

  addRoleOption(fn: (option: SlashRoleOption) => SlashRoleOption): this {
    const option = fn(new SlashRoleOption());
    this.addRawOption(option.toJSON());
    return this;
  }

  addMentionableOption(fn: (option: SlashMentionableOption) => SlashMentionableOption): this {
    const option = fn(new SlashMentionableOption());
    this.addRawOption(option.toJSON());
    return this;
  }

  addAttachmentOption(fn: (option: SlashAttachmentOption) => SlashAttachmentOption): this {
    const option = fn(new SlashAttachmentOption());
    this.addRawOption(option.toJSON());
    return this;
  }

  addBooleanOption(fn: (option: SlashBooleanOption) => SlashBooleanOption): this {
    const option = fn(new SlashBooleanOption());
    this.addRawOption(option.toJSON());
    return this;
  }

  addRawOption(option: ApplicationCommandBasicOptions) {
    this.data.options ??= [];
    this.data.options.push(option);
  }
}

export type APIApplicationCommandSubcommandGroupOption = AACSGO & {
  options?: APIApplicationCommandSubcommandOption[];
};

export type AllSlashOptions = BasicSlashOptions | SlashSubcommandGroupOption | SlashSubcommandOption;

export class SlashSubcommandGroupOption extends SlashBaseOption<APIApplicationCommandSubcommandGroupOption> {
  constructor(data: Partial<APIApplicationCommandSubcommandGroupOption> = {}) {
    if (!data.options) data.options = [];
    super({ ...data, type: ApplicationCommandOptionType.SubcommandGroup });
  }

  addSubCommand(fn: (option: SlashSubcommandOption) => SlashSubcommandOption): this {
    const option = fn(new SlashSubcommandOption());
    this.addRawOption(option.toJSON());
    return this;
  }

  addRawOption(option: ReturnType<SlashSubcommandOption['toJSON']>) {
    this.data.options ??= [];
    this.data.options.push(option);
  }
}
