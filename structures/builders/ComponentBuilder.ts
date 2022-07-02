import type { DiscordActionRow, MessageComponentTypes } from "../../vendor/external.ts";
import { AnyDiscordComponent } from "../../util/Components.ts";

export abstract class ComponentBuilder<
    DataType extends AnyDiscordComponent | DiscordActionRow,
> {
    constructor(data: DataType) {
        this.data = data;
        this.type = data.type;
    }
    data: DataType;
    type: MessageComponentTypes;

    abstract toJSON(): DataType;
}
