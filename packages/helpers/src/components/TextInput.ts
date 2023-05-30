import { APITextInputComponent, ComponentType, TextInputStyle } from '@biscuitland/common';
import { BaseComponent } from './BaseComponent';
import { OptionValuesLength } from '..';

export class ModalTextInput extends BaseComponent<APITextInputComponent> {
  constructor(data: Partial<APITextInputComponent> = {}) {
    super({ ...data, type: ComponentType.TextInput });
  }

  setStyle(style: TextInputStyle): this {
    this.data.style = style;
    return this;
  }

  setLabel(label: string): this {
    this.data.label = label;
    return this;
  }

  setPlaceholder(placeholder: string): this {
    this.data.placeholder = placeholder;
    return this;
  }

  setLength({ max, min }: Partial<OptionValuesLength>): this {
    this.data.max_length = max;
    this.data.min_length = min;
    return this;
  }

  setCustomId(id: string): this {
    this.data.custom_id = id;
    return this;
  }

  setValue(value: string): this {
    this.data.value = value;
    return this;
  }

  setRequired(required = true): this {
    this.data.required = required;
    return this;
  }
}
