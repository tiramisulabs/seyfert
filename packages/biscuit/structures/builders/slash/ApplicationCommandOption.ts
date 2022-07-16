import { ApplicationCommandOptionTypes, type ChannelTypes, type Localization } from "../../../../discordeno/mod.ts";
import { ApplicationCommandOptionChoice } from "../../interactions/BaseInteraction.ts";

export class ChoiceBuilder {
    name?: string;
    value?: string;

    setName(name: string): ChoiceBuilder {
        this.name = name;
        return this;
    }

    setValue(value: string): this {
        this.value = value;
        return this;
    }

    toJSON(): ApplicationCommandOptionChoice {
        if (!this.name) throw new TypeError("Property 'name' is required");
        if (!this.value) throw new TypeError("Property 'value' is required");

        return {
            name: this.name,
            value: this.value,
        };
    }
}

export class OptionBuilder {
    required?: boolean;
    autocomplete?: boolean;
    type?: ApplicationCommandOptionTypes;
    name?: string;
    description?: string;

    constructor(type?: ApplicationCommandOptionTypes, name?: string, description?: string) {
        this.type = type;
        this.name = name;
        this.description = description;
    }

    setType(type: ApplicationCommandOptionTypes): this {
        return (this.type = type), this;
    }

    setName(name: string): this {
        return (this.name = name), this;
    }

    setDescription(description: string): this {
        return (this.description = description), this;
    }

    setRequired(required: boolean): this {
        return (this.required = required), this;
    }

    toJSON(): ApplicationCommandOption {
        if (!this.type) throw new TypeError("Property 'type' is required");
        if (!this.name) throw new TypeError("Property 'name' is required");
        if (!this.description) {
            throw new TypeError("Property 'description' is required");
        }

        const applicationCommandOption: ApplicationCommandOption = {
            type: this.type,
            name: this.name,
            description: this.description,
            required: this.required ? true : false,
        };

        return applicationCommandOption;
    }
}

export class OptionBuilderLimitedValues extends OptionBuilder {
    choices?: ChoiceBuilder[];
    minValue?: number;
    maxValue?: number;

    constructor(
        type?: ApplicationCommandOptionTypes.Integer | ApplicationCommandOptionTypes.Number,
        name?: string,
        description?: string,
    ) {
        super();
        this.type = type;
        this.name = name;
        this.description = description;
    }

    setMinValue(n: number): this {
        return (this.minValue = n), this;
    }

    setMaxValue(n: number): this {
        return (this.maxValue = n), this;
    }

    addChoice(fn: (choice: ChoiceBuilder) => ChoiceBuilder): this {
        const choice = fn(new ChoiceBuilder());
        this.choices ??= [];
        this.choices.push(choice);
        return this;
    }

    override toJSON(): ApplicationCommandOption {
        return {
            ...super.toJSON(),
            choices: this.choices?.map((c) => c.toJSON()) ?? [],
            minValue: this.minValue,
            maxValue: this.maxValue,
        };
    }
}

export class OptionBuilderString extends OptionBuilder {
    choices?: ChoiceBuilder[];
    constructor(
        type?: ApplicationCommandOptionTypes.String,
        name?: string,
        description?: string,
    ) {
        super();
        this.type = type;
        this.name = name;
        this.description = description;
        this;
    }

    addChoice(fn: (choice: ChoiceBuilder) => ChoiceBuilder): this {
        const choice = fn(new ChoiceBuilder());
        this.choices ??= [];
        this.choices.push(choice);
        return this;
    }

    override toJSON(): ApplicationCommandOption {
        return {
            ...super.toJSON(),
            choices: this.choices?.map((c) => c.toJSON()) ?? [],
        };
    }
}

export class OptionBuilderChannel extends OptionBuilder {
    channelTypes?: ChannelTypes[];
    constructor(
        type?: ApplicationCommandOptionTypes.Channel,
        name?: string,
        description?: string,
    ) {
        super();
        this.type = type;
        this.name = name;
        this.description = description;
        this;
    }

    addChannelTypes(...channels: ChannelTypes[]): this {
        this.channelTypes ??= [];
        this.channelTypes.push(...channels);
        return this;
    }

    override toJSON(): ApplicationCommandOption {
        return {
            ...super.toJSON(),
            channelTypes: this.channelTypes ?? [],
        };
    }
}

export interface OptionBuilderLike {
    toJSON(): ApplicationCommandOption;
}

export class OptionBased {
    options?:
        & (
            | OptionBuilder[]
            | OptionBuilderString[]
            | OptionBuilderLimitedValues[]
            | OptionBuilderNested[]
            | OptionBuilderChannel[]
        )
        & OptionBuilderLike[];

    addOption(fn: (option: OptionBuilder) => OptionBuilder, type?: ApplicationCommandOptionTypes): this {
        const option = fn(new OptionBuilder(type));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    addNestedOption(fn: (option: OptionBuilder) => OptionBuilder): this {
        const option = fn(new OptionBuilder(ApplicationCommandOptionTypes.SubCommand));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    addStringOption(fn: (option: OptionBuilderString) => OptionBuilderString): this {
        const option = fn(new OptionBuilderString(ApplicationCommandOptionTypes.String));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    addIntegerOption(fn: (option: OptionBuilderLimitedValues) => OptionBuilderLimitedValues): this {
        const option = fn(new OptionBuilderLimitedValues(ApplicationCommandOptionTypes.Integer));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    addNumberOption(fn: (option: OptionBuilderLimitedValues) => OptionBuilderLimitedValues): this {
        const option = fn(new OptionBuilderLimitedValues(ApplicationCommandOptionTypes.Number));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    addBooleanOption(fn: (option: OptionBuilder) => OptionBuilder): this {
        return this.addOption(fn, ApplicationCommandOptionTypes.Boolean);
    }

    addSubCommand(fn: (option: OptionBuilderNested) => OptionBuilderNested): this {
        const option = fn(new OptionBuilderNested(ApplicationCommandOptionTypes.SubCommand));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    addSubCommandGroup(fn: (option: OptionBuilderNested) => OptionBuilderNested): this {
        const option = fn(new OptionBuilderNested(ApplicationCommandOptionTypes.SubCommandGroup));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    addUserOption(fn: (option: OptionBuilder) => OptionBuilder): this {
        return this.addOption(fn, ApplicationCommandOptionTypes.User);
    }

    addChannelOption(fn: (option: OptionBuilderChannel) => OptionBuilderChannel): this {
        const option = fn(new OptionBuilderChannel(ApplicationCommandOptionTypes.Channel));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    addRoleOption(fn: (option: OptionBuilder) => OptionBuilder): this {
        return this.addOption(fn, ApplicationCommandOptionTypes.Role);
    }

    addMentionableOption(fn: (option: OptionBuilder) => OptionBuilder): this {
        return this.addOption(fn, ApplicationCommandOptionTypes.Mentionable);
    }

    // deno-lint-ignore ban-types
    static applyTo(klass: Function, ignore: Array<keyof OptionBased> = []): void {
        const methods: Array<keyof OptionBased> = [
            "addOption",
            "addNestedOption",
            "addStringOption",
            "addIntegerOption",
            "addNumberOption",
            "addBooleanOption",
            "addSubCommand",
            "addSubCommandGroup",
            "addUserOption",
            "addChannelOption",
            "addRoleOption",
            "addMentionableOption",
        ];

        for (const method of methods) {
            if (ignore.includes(method)) continue;

            klass.prototype[method] = OptionBased.prototype[method];
        }
    }
}

export class OptionBuilderNested extends OptionBuilder {
    constructor(
        type?: ApplicationCommandOptionTypes.SubCommand | ApplicationCommandOptionTypes.SubCommandGroup,
        name?: string,
        description?: string,
    ) {
        super();
        this.type = type;
        this.name = name;
        this.description = description;
    }

    override toJSON(): ApplicationCommandOption {
        if (!this.type) throw new TypeError("Property 'type' is required");
        if (!this.name) throw new TypeError("Property 'name' is required");
        if (!this.description) {
            throw new TypeError("Property 'description' is required");
        }

        return {
            type: this.type,
            name: this.name,
            description: this.description,
            options: this.options?.map((o) => o.toJSON()) ?? [],
            required: this.required ? true : false,
        };
    }
}

OptionBased.applyTo(OptionBuilderNested);

export interface OptionBuilderNested extends OptionBuilder, OptionBased {
    // pass
}

export interface ApplicationCommandOption {
    /** Value of Application Command Option Type */
    type: ApplicationCommandOptionTypes;
    /** 1-32 character name matching lowercase `^[\w-]{1,32}$` */
    name: string;
    /** Localization object for the `name` field. Values follow the same restrictions as `name` */
    nameLocalizations?: Localization;
    /** 1-100 character description */
    description: string;
    /** Localization object for the `description` field. Values follow the same restrictions as `description` */
    descriptionLocalizations?: Localization;
    /** If the parameter is required or optional--default `false` */
    required?: boolean;
    /** Choices for `string` and `int` types for the user to pick from */
    choices?: ApplicationCommandOptionChoice[];
    /** If the option is a subcommand or subcommand group type, this nested options will be the parameters */
    options?: ApplicationCommandOption[];
    /** if autocomplete interactions are enabled for this `String`, `Integer`, or `Number` type option */
    autocomplete?: boolean;
    /** If the option is a channel type, the channels shown will be restricted to these types */
    channelTypes?: ChannelTypes[];
    /** Minimum number desired. */
    minValue?: number;
    /** Maximum number desired. */
    maxValue?: number;
}
