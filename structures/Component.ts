import type { Session } from "../session/Session.ts";
import type { DiscordComponent, MessageComponentTypes } from "../vendor/external.ts";
import Emoji from "./Emoji.ts";

export class Component {
    constructor(session: Session, data: DiscordComponent) {
        this.session = session;
        this.customId = data.custom_id;
        this.type = data.type
        this.components = data.components?.map((component) => new Component(session, component));
        this.disabled = !!data.disabled;

        if (data.emoji) {
            this.emoji = new Emoji(session, data.emoji);
        }

        this.maxValues = data.max_values;
        this.minValues = data.min_values;
        this.label = data.label;
        this.value = data.value;
        this.options = data.options ?? [];
        this.placeholder = data.placeholder;
    }

    readonly session: Session;

    customId?: string;
    type: MessageComponentTypes;
    components?: Component[];
    disabled: boolean;
    emoji?: Emoji;
    maxValues?: number;
    minValues?: number;
    label?: string;
    value?: string;
    // deno-lint-ignore no-explicit-any
    options: any[];
    placeholder?: string;
}

export default Component;
