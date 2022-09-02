import type { DiscordActionRow } from '@biscuitland/api-types';
import { MessageComponentTypes } from '@biscuitland/api-types';
import type { ComponentBuilder } from '../../../../core/src/utils/util';

export class ActionRowBuilder<T extends ComponentBuilder> {
    constructor() {
        this.components = [] as T[];
        this.type = MessageComponentTypes.ActionRow;
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
            // @ts-ignore: socram fix this
            components: this.components.map(c => c.toJSON()) as DiscordActionRow['components'],
        };
    }
}
