import { ApplicationCommandOptionTypes, type ChannelTypes, type Localization } from "../../../../discordeno/mod.ts";
import { ApplicationCommandOptionChoice } from "../../interactions/BaseInteraction.ts";

export class ChoiceBuilder {
    public name?: string;
    public value?: string;

    public setName(name: string): ChoiceBuilder {
        this.name = name;
        return this;
    }

    public setValue(value: string): this {
        this.value = value;
        return this;
    }

    public toJSON(): ApplicationCommandOptionChoice {
        if (!this.name) throw new TypeError("Property 'name' is required");
        if (!this.value) throw new TypeError("Property 'value' is required");

        return {
            name: this.name,
            value: this.value,
        };
    }
}

export class OptionBuilder {
    public required?: boolean;
    public autocomplete?: boolean;

    public constructor(public type?: ApplicationCommandOptionTypes, public name?: string, public description?: string) {
        this.type = type;
        this.name = name;
        this.description = description;
    }

    public setType(type: ApplicationCommandOptionTypes): this {
        return (this.type = type), this;
    }

    public setName(name: string): this {
        return (this.name = name), this;
    }

    public setDescription(description: string): this {
        return (this.description = description), this;
    }

    public setRequired(required: boolean): this {
        return (this.required = required), this;
    }

    public toJSON(): ApplicationCommandOption {
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
    public choices?: ChoiceBuilder[];
    public minValue?: number;
    public maxValue?: number;

    public constructor(
        public type?: ApplicationCommandOptionTypes.Integer | ApplicationCommandOptionTypes.Number,
        public name?: string,
        public description?: string,
    ) {
        super();
        this.type = type;
        this.name = name;
        this.description = description;
    }

    public setMinValue(n: number): this {
        return (this.minValue = n), this;
    }

    public setMaxValue(n: number): this {
        return (this.maxValue = n), this;
    }

    public addChoice(fn: (choice: ChoiceBuilder) => ChoiceBuilder): this {
        const choice = fn(new ChoiceBuilder());
        this.choices ??= [];
        this.choices.push(choice);
        return this;
    }

    public override toJSON(): ApplicationCommandOption {
        return {
            ...super.toJSON(),
            choices: this.choices?.map((c) => c.toJSON()) ?? [],
            minValue: this.minValue,
            maxValue: this.maxValue,
        };
    }
}

export class OptionBuilderString extends OptionBuilder {
    public choices?: ChoiceBuilder[];
    public constructor(
        public type?: ApplicationCommandOptionTypes.String,
        public name?: string,
        public description?: string,
    ) {
        super();
        this.type = type;
        this.name = name;
        this.description = description;
        this;
    }

    public addChoice(fn: (choice: ChoiceBuilder) => ChoiceBuilder): this {
        const choice = fn(new ChoiceBuilder());
        this.choices ??= [];
        this.choices.push(choice);
        return this;
    }

    public override toJSON(): ApplicationCommandOption {
        return {
            ...super.toJSON(),
            choices: this.choices?.map((c) => c.toJSON()) ?? [],
        };
    }
}

export class OptionBuilderChannel extends OptionBuilder {
    public channelTypes?: ChannelTypes[];
    public constructor(
        public type?: ApplicationCommandOptionTypes.Channel,
        public name?: string,
        public description?: string,
    ) {
        super();
        this.type = type;
        this.name = name;
        this.description = description;
        this;
    }

    public addChannelTypes(...channels: ChannelTypes[]): this {
        this.channelTypes ??= [];
        this.channelTypes.push(...channels);
        return this;
    }

    public override toJSON(): ApplicationCommandOption {
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
    public options?:
        & (
            | OptionBuilder[]
            | OptionBuilderString[]
            | OptionBuilderLimitedValues[]
            | OptionBuilderNested[]
            | OptionBuilderChannel[]
        )
        & OptionBuilderLike[];

    public addOption(fn: (option: OptionBuilder) => OptionBuilder, type?: ApplicationCommandOptionTypes): this {
        const option = fn(new OptionBuilder(type));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    public addNestedOption(fn: (option: OptionBuilder) => OptionBuilder): this {
        const option = fn(new OptionBuilder(ApplicationCommandOptionTypes.SubCommand));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    public addStringOption(fn: (option: OptionBuilderString) => OptionBuilderString): this {
        const option = fn(new OptionBuilderString(ApplicationCommandOptionTypes.String));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    public addIntegerOption(fn: (option: OptionBuilderLimitedValues) => OptionBuilderLimitedValues): this {
        const option = fn(new OptionBuilderLimitedValues(ApplicationCommandOptionTypes.Integer));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    public addNumberOption(fn: (option: OptionBuilderLimitedValues) => OptionBuilderLimitedValues): this {
        const option = fn(new OptionBuilderLimitedValues(ApplicationCommandOptionTypes.Number));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    public addBooleanOption(fn: (option: OptionBuilder) => OptionBuilder): this {
        return this.addOption(fn, ApplicationCommandOptionTypes.Boolean);
    }

    public addSubCommand(fn: (option: OptionBuilderNested) => OptionBuilderNested): this {
        const option = fn(new OptionBuilderNested(ApplicationCommandOptionTypes.SubCommand));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    public addSubCommandGroup(fn: (option: OptionBuilderNested) => OptionBuilderNested): this {
        const option = fn(new OptionBuilderNested(ApplicationCommandOptionTypes.SubCommandGroup));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    public addUserOption(fn: (option: OptionBuilder) => OptionBuilder): this {
        return this.addOption(fn, ApplicationCommandOptionTypes.User);
    }

    public addChannelOption(fn: (option: OptionBuilderChannel) => OptionBuilderChannel): this {
        const option = fn(new OptionBuilderChannel(ApplicationCommandOptionTypes.Channel));
        this.options ??= [];
        this.options.push(option);
        return this;
    }

    public addRoleOption(fn: (option: OptionBuilder) => OptionBuilder): this {
        return this.addOption(fn, ApplicationCommandOptionTypes.Role);
    }

    public addMentionableOption(fn: (option: OptionBuilder) => OptionBuilder): this {
        return this.addOption(fn, ApplicationCommandOptionTypes.Mentionable);
    }

    // deno-lint-ignore ban-types
    public static applyTo(klass: Function, ignore: Array<keyof OptionBased> = []): void {
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
    public constructor(
        public type?: ApplicationCommandOptionTypes.SubCommand | ApplicationCommandOptionTypes.SubCommandGroup,
        public name?: string,
        public description?: string,
    ) {
        super();
        this.type = type;
        this.name = name;
        this.description = description;
    }

    public override toJSON(): ApplicationCommandOption {
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
