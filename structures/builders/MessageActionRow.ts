import { ComponentBuilder } from "./ComponentBuilder.ts";
import { DiscordActionRow, MessageComponentTypes } from "../../vendor/external.ts";
import { AnyComponentBuilder, AnyDiscordComponent, createBuilderComponent } from "../../util/Components.ts";

export class ActionRowBuilder<T extends AnyComponentBuilder | AnyDiscordComponent>
    extends ComponentBuilder<DiscordActionRow> {
    constructor(data?: DiscordActionRow) {
        super({ ...data!, type: MessageComponentTypes.ActionRow });
        this.components = (data?.components.map((component) => createBuilderComponent(component)) ?? []) as T[];
    }
    components: T[];

    addComponents(...components: T[]) {
        this.components.push(
            ...components.map(
                (option) => createBuilderComponent(option) as T,
            ),
        );
        return this;
    }

    setComponents(...components: T[]) {
        this.components.splice(
            0,
            this.components.length,
            ...components.map(
                (option) => createBuilderComponent(option) as T,
            ),
        );
        return this;
    }

    toJSON() {
        return { ...this.data };
    }
}
