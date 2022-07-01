import { DiscordActionRow, MessageComponentTypes } from "../../vendor/external.ts";
import { BuildComponent } from "./BuildComponent.ts";
import { AnyComponent, createComponent } from "../../util/Components.ts";

/**
 * Represents Discord Action Row
 * @link https://discord.com/developers/docs/interactions/message-components#action-rows
 */
export class ActionRow<T extends AnyComponent> extends BuildComponent<DiscordActionRow> {
    constructor(data?: DiscordActionRow) {
        super({ ...data!, type: MessageComponentTypes.ActionRow });
        this.components = (data?.components.map((c) => createComponent(c)) ?? []) as T[];
    }
    components: T[];

    addComponents(...components: T[]) {
        this.components.push(
            ...components.map(
                (option) => option instanceof BuildComponent ? option : createComponent(option) as T,
            ),
        );
        return this;
    }

    setComponents(...components: T[]) {
        this.components.splice(0, this.components.length, ...components);
        return this;
    }
}
