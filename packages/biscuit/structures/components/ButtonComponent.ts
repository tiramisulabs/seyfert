import type { Session } from '../../Session.ts';
import type { DiscordComponent } from '../../../discordeno/mod.ts';
import type { ButtonComponent, ClassicButton } from './Component.ts';
import { MessageComponentTypes } from '../../../discordeno/mod.ts';
import BaseComponent from './Component.ts';
import Emoji from '../Emoji.ts';

export class Button extends BaseComponent implements ButtonComponent {
    constructor(session: Session, data: DiscordComponent) {
        super(data.type);

        this.session = session;
        this.type = data.type as MessageComponentTypes.Button;
        this.customId = data.custom_id;
        this.label = data.label;
        this.style = data.style as ClassicButton;
        this.disabled = data.disabled;

        if (data.emoji) {
            this.emoji = new Emoji(session, data.emoji);
        }
    }

    readonly session: Session;
    override type: MessageComponentTypes.Button;
    customId?: string;
    label?: string;
    style: ClassicButton;
    disabled?: boolean;
    emoji?: Emoji;
}

export default Button;
