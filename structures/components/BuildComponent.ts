import type { DiscordActionRow, MessageComponentTypes } from "../../vendor/external.ts";
import { AnyDiscordComponent } from "../../util/Components.ts";

export abstract class BuildComponent<
    DataType extends AnyDiscordComponent | DiscordActionRow,
> {
    constructor(data: DataType) {
        this.type = data.type;
    }
    type: MessageComponentTypes;
}
