import type { Session } from "../../Session.ts";
import type { DiscordInputTextComponent } from "../../../discordeno/mod.ts";
import type { TextInputComponent } from "./Component.ts";
import { MessageComponentTypes, TextStyles } from "../../../discordeno/mod.ts";
import BaseComponent from "./Component.ts";

export class TextInput extends BaseComponent implements TextInputComponent {
    constructor(session: Session, data: DiscordInputTextComponent) {
        super(data.type);

        this.session = session;
        this.type = data.type as MessageComponentTypes.InputText;
        this.customId = data.custom_id!;
        this.label = data.label!;
        this.style = data.style as TextStyles;

        this.placeholder = data.placeholder;
        this.value = data.value;

        
        this.minLength = data.min_length;
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
