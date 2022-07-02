import { DiscordActionRow, MessageComponentTypes } from "../../vendor/external.ts";
import { BaseComponent } from "./BaseComponent.ts";
import { AnyComponent, createComponent } from "../../util/Components.ts";

/**
 * Represents Discord Action Row
 * @link https://discord.com/developers/docs/interactions/message-components#action-rows
 */
export class ActionRow<T extends AnyComponent> extends BaseComponent<MessageComponentTypes.ActionRow> {
    constructor(data: DiscordActionRow) {
        super(data.type);
        this.components = (data?.components.map((c) => createComponent(c)) ?? []) as T[];
    }
    components: T[];
}
