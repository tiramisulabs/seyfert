import { APIActionRowComponent, APIMessageActionRowComponent, ComponentType, TypeArray } from "@biscuitland/common";
import { MessageComponents, createComponent } from "../Utils";
import { BaseComponent } from "./BaseComponent";

export class MessageActionRow<T extends MessageComponents> extends BaseComponent<APIActionRowComponent<APIMessageActionRowComponent>> {
  constructor({ components, ...data }: Partial<APIActionRowComponent<APIMessageActionRowComponent>> = {}) {
    super({ ...data, type: ComponentType.ActionRow });
    this.components = (components?.map(createComponent) ?? []) as T[];
  }
  components: T[];

  addComponents(component: TypeArray<T>): this {
    this.components.concat(component);
    return this;
  }

  setComponents(component: T[]): this {
    this.components = [...component];
    return this;
  }

  toJSON(): APIActionRowComponent<APIMessageActionRowComponent> {
    return {
      ...this.data,
      components: this.components.map((c) => c.toJSON()),
    } as APIActionRowComponent<ReturnType<T["toJSON"]>>;
  }
}
