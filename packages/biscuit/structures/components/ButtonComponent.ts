import type { Session } from "../../Session.ts";
import type { ButtonStyles, DiscordComponent } from "../../../discordeno/mod.ts";
import type { ButtonComponent } from "./Component.ts";
import { MessageComponentTypes } from "../../../discordeno/mod.ts";
import BaseComponent from "./Component.ts";
import Emoji from "../Emoji.ts";

export class Button extends BaseComponent implements ButtonComponent {
    constructor(session: Session, data: DiscordComponent) {
        super(data.type);

        this.session = session;
        this.type = data.type as MessageComponentTypes.Button;
        this.customId = data.custom_id;
        this.label = data.label;
        this.style = data.style as number;
        this.disabled = data.disabled;

        if (data.emoji) {
            this.emoji = new Emoji(session, data.emoji);
        }
    }

    readonly session: Session;
    override type: MessageComponentTypes.Button;
    customId?: string;
    label?: string;
    style: ButtonStyles.Primary | ButtonStyles.Secondary | ButtonStyles.Success | ButtonStyles.Danger;
    disabled?: boolean;
    emoji?: Emoji;
}

export default Button;
