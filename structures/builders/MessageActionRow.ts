import { MessageComponentTypes } from "../../vendor/external.ts";
import { AnyComponentBuilder } from "../../util/builders.ts";

export class ActionRowBuilder<T extends AnyComponentBuilder> {
    constructor() {
        this.components = [] as T[];
        this.type = 1;
    }
    components: T[];
    type: MessageComponentTypes.ActionRow;

    addComponents(...components: T[]) {
        this.components.push(...components);
        return this;
    }

    setComponents(...components: T[]) {
        this.components.splice(
            0,
            this.components.length,
            ...components,
        );
        return this;
    }

    toJSON() {
        return { type: this.type, components: this.components.map((c) => c.toJSON()) };
    }
}
