import type { DiscordSelectOption } from '../../../../discordeno/mod.ts';
import type { ComponentEmoji } from '../../../Util.ts';

export class SelectMenuOptionBuilder {
    constructor() {
        this.#data = {} as DiscordSelectOption;
    }
    #data: DiscordSelectOption;

    setLabel(label: string): SelectMenuOptionBuilder {
        this.#data.label = label;
        return this;
    }

    setValue(value: string): SelectMenuOptionBuilder {
        this.#data.value = value;
        return this;
    }

    setDescription(description: string): SelectMenuOptionBuilder {
        this.#data.description = description;
        return this;
    }

    setDefault(Default = true): SelectMenuOptionBuilder {
        this.#data.default = Default;
        return this;
    }

    setEmoji(emoji: ComponentEmoji): SelectMenuOptionBuilder {
        this.#data.emoji = emoji;
        return this;
    }

    toJSON(): DiscordSelectOption {
        return { ...this.#data };
    }
}
