import {
  APIChannelSelectComponent,
  APIMentionableSelectComponent,
  APIMessageComponentEmoji,
  APIRoleSelectComponent,
  APISelectMenuComponent,
  APISelectMenuOption,
  APIStringSelectComponent,
  APIUserSelectComponent,
  ChannelType,
  ComponentType,
  TypeArray
} from '@biscuitland/common';
import { BaseComponent } from './BaseComponent';
import { OptionValuesLength } from '..';

class SelectMenu<Select extends APISelectMenuComponent = APISelectMenuComponent,> extends BaseComponent<Select> {
  setCustomId(id: string): this {
    this.data.custom_id = id;
    return this;
  }

  setPlaceholder(placeholder: string): this {
    this.data.placeholder = placeholder;
    return this;
  }

  setValuesLength({ max, min }: Partial<OptionValuesLength>): this {
    this.data.max_values = max;
    this.data.min_values = min;
    return this;
  }

  setDisabled(disabled = true): this {
    this.data.disabled = disabled;
    return this;
  }
}

export class UserSelectMenu extends SelectMenu<APIUserSelectComponent> {
  constructor(data: Partial<APIUserSelectComponent> = {}) {
    super({ ...data, type: ComponentType.UserSelect });
  }
}

export class RoleSelectMenu extends SelectMenu<APIRoleSelectComponent> {
  constructor(data: Partial<APIRoleSelectComponent> = {}) {
    super({ ...data, type: ComponentType.RoleSelect });
  }
}

export class MentionableSelectMenu extends SelectMenu<APIMentionableSelectComponent> {
  constructor(data: Partial<APIMentionableSelectComponent> = {}) {
    super({ ...data, type: ComponentType.MentionableSelect });
  }
}

export class ChannelSelectMenu extends SelectMenu<APIChannelSelectComponent> {
  constructor(data: Partial<APIChannelSelectComponent> = {}) {
    super({ ...data, type: ComponentType.ChannelSelect });
  }

  setChannelTypes(types: ChannelType[]): this {
    this.data.channel_types = types;
    return this;
  }
}

export class StringSelectMenu extends SelectMenu<APIStringSelectComponent> {
  constructor(data: Partial<APIStringSelectComponent> = {}) {
    super({ ...data, type: ComponentType.StringSelect });
  }

  addOption(option: TypeArray<APISelectMenuOption>): this {
    this.data.options ??= [];
    this.data.options.concat(option);
    return this;
  }

  setOptions(options: APISelectMenuOption[]): this {
    this.data.options = options;
    return this;
  }
}

export class StringSelectOption {
  constructor(public data: Partial<APISelectMenuOption> = {}) {}

  setLabel(label: string): this {
    this.data.label = label;
    return this;
  }

  setValue(value: string): this {
    this.data.value = value;
    return this;
  }

  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  setDefault(Default = true): this {
    this.data.default = Default;
    return this;
  }

  setEmoji(emoji: APIMessageComponentEmoji): this {
    this.data.emoji = emoji;
    return this;
  }

  toJSON(): APISelectMenuOption {
    return { ...this.data } as APISelectMenuOption;
  }
}
