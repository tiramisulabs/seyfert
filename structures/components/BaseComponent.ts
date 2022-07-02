import type { MessageComponentTypes } from "../../vendor/external.ts";

export abstract class BaseComponent<
    T extends MessageComponentTypes,
> {
    constructor(type: T) {
        this.type = type;
    }
    type: MessageComponentTypes;
}
