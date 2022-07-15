import type { DiscordActionRow, MessageComponentTypes } from "../../../../discordeno/mod.ts";
import type { ComponentBuilder } from "../../../Util.ts";

export class ActionRowBuilder<T extends ComponentBuilder> {
    constructor() {
        this.components = [] as T[];
        this.type = 1;
    }
    components: T[];
    type: MessageComponentTypes.ActionRow;

    addComponents(...components: T[]): this {
        this.components.push(...components);
        return this;
    }

    setComponents(...components: T[]): this {
        this.components.splice(
            0,
            this.components.length,
            ...components,
        );
        return this;
    }

    toJSON(): DiscordActionRow {
        return {
            type: this.type,
            components: this.components.map((c) => c.toJSON()) as DiscordActionRow["components"],
        };
    }
}
