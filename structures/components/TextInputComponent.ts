import type { Session } from "../../session/Session.ts";
import type { DiscordComponent } from "../../vendor/external.ts";
import type { TextInputComponent } from "./Component.ts";
import { MessageComponentTypes, TextStyles } from "../../vendor/external.ts";
import BaseComponent from "./Component.ts";

export class TextInput extends BaseComponent implements TextInputComponent {
    constructor(session: Session, data: DiscordComponent) {
        super(data.type);

        this.session = session;
        this.type = data.type as MessageComponentTypes.InputText;
        this.customId = data.custom_id!;
        this.label = data.label!;
        this.style = data.style as TextStyles;

        this.placeholder = data.placeholder;
        this.value = data.value;

        // @ts-ignore: vendor bug
        this.minLength = data.min_length;

        // @ts-ignore: vendor bug
        this.maxLength = data.max_length;
    }

    readonly session: Session;
    override type: MessageComponentTypes.InputText;
    style: TextStyles;
    customId: string;
    label: string;
    placeholder?: string;
    value?: string;
    minLength?: number;
    maxLength?: number;
}

export default TextInput;
