"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionBuilderNested = exports.OptionBased = exports.OptionBuilderChannel = exports.OptionBuilderString = exports.OptionBuilderLimitedValues = exports.OptionBuilder = exports.ChoiceBuilder = void 0;
const api_types_1 = require("@biscuitland/api-types");
class ChoiceBuilder {
    setName(name) {
        this.name = name;
        return this;
    }
    setValue(value) {
        this.value = value;
        return this;
    }
    toJSON() {
        if (!this.name) {
            throw new TypeError('Property \'name\' is required');
        }
        if (!this.value) {
            throw new TypeError('Property \'value\' is required');
        }
        return {
            name: this.name,
            value: this.value,
        };
    }
}
exports.ChoiceBuilder = ChoiceBuilder;
class OptionBuilder {
    constructor(type, name, description) {
        this.type = type;
        this.name = name;
        this.description = description;
    }
    setType(type) {
        return (this.type = type), this;
    }
    setName(name, localization) {
        this.name = name;
        this.nameLocalization = localization;
        return this;
    }
    setDescription(description, localization) {
        this.description = description;
        this.descriptionLocalization = localization;
        return this;
    }
    setRequired(required) {
        return (this.required = required), this;
    }
    toJSON() {
        if (!this.type) {
            throw new TypeError('Property \'type\' is required');
        }
        if (!this.name) {
            throw new TypeError('Property \'name\' is required');
        }
        if (!this.description) {
            throw new TypeError('Property \'description\' is required');
        }
        const applicationCommandOption = {
            type: this.type,
            name: this.name,
            name_localizations: this.nameLocalization,
            description: this.description,
            description_localizations: this.descriptionLocalization,
            required: this.required ? true : false,
        };
        return applicationCommandOption;
    }
}
exports.OptionBuilder = OptionBuilder;
class OptionBuilderLimitedValues extends OptionBuilder {
    constructor(type, name, description) {
        super();
        this.type = type;
        this.name = name;
        this.description = description;
    }
    setMinValue(n) {
        return (this.minValue = n), this;
    }
    setMaxValue(n) {
        return (this.maxValue = n), this;
    }
    addChoice(fn) {
        const choice = fn(new ChoiceBuilder());
        this.choices ??= [];
        this.choices.push(choice);
        return this;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            choices: this.choices?.map(c => c.toJSON()) ?? [],
            min_value: this.minValue,
            max_value: this.maxValue,
        };
    }
}
exports.OptionBuilderLimitedValues = OptionBuilderLimitedValues;
class OptionBuilderString extends OptionBuilder {
    constructor(type, name, description) {
        super();
        this.type = type;
        this.name = name;
        this.description = description;
        this;
    }
    addChoice(fn) {
        const choice = fn(new ChoiceBuilder());
        this.choices ??= [];
        this.choices.push(choice);
        return this;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            choices: this.choices?.map(c => c.toJSON()) ?? [],
        };
    }
}
exports.OptionBuilderString = OptionBuilderString;
class OptionBuilderChannel extends OptionBuilder {
    constructor(type, name, description) {
        super();
        this.type = type;
        this.name = name;
        this.description = description;
        this;
    }
    addChannelTypes(...channels) {
        this.channelTypes ??= [];
        this.channelTypes.push(...channels);
        return this;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            channel_types: this.channelTypes ?? [],
        };
    }
}
exports.OptionBuilderChannel = OptionBuilderChannel;
class OptionBased {
    addOption(fn, type) {
        const option = fn(new OptionBuilder(type));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addNestedOption(fn) {
        const option = fn(new OptionBuilder(api_types_1.ApplicationCommandOptionTypes.SubCommand));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addStringOption(fn) {
        const option = fn(new OptionBuilderString(api_types_1.ApplicationCommandOptionTypes.String));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addIntegerOption(fn) {
        const option = fn(new OptionBuilderLimitedValues(api_types_1.ApplicationCommandOptionTypes.Integer));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addNumberOption(fn) {
        const option = fn(new OptionBuilderLimitedValues(api_types_1.ApplicationCommandOptionTypes.Number));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addBooleanOption(fn) {
        return this.addOption(fn, api_types_1.ApplicationCommandOptionTypes.Boolean);
    }
    addSubCommand(fn) {
        const option = fn(new OptionBuilderNested(api_types_1.ApplicationCommandOptionTypes.SubCommand));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addSubCommandGroup(fn) {
        const option = fn(new OptionBuilderNested(api_types_1.ApplicationCommandOptionTypes.SubCommandGroup));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addUserOption(fn) {
        return this.addOption(fn, api_types_1.ApplicationCommandOptionTypes.User);
    }
    addChannelOption(fn) {
        const option = fn(new OptionBuilderChannel(api_types_1.ApplicationCommandOptionTypes.Channel));
        this.options ??= [];
        this.options.push(option);
        return this;
    }
    addRoleOption(fn) {
        return this.addOption(fn, api_types_1.ApplicationCommandOptionTypes.Role);
    }
    addMentionableOption(fn) {
        return this.addOption(fn, api_types_1.ApplicationCommandOptionTypes.Mentionable);
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    static applyTo(klass, ignore = []) {
        const methods = [
            'addOption',
            'addNestedOption',
            'addStringOption',
            'addIntegerOption',
            'addNumberOption',
            'addBooleanOption',
            'addSubCommand',
            'addSubCommandGroup',
            'addUserOption',
            'addChannelOption',
            'addRoleOption',
            'addMentionableOption',
        ];
        for (const method of methods) {
            if (ignore.includes(method)) {
                continue;
            }
            klass.prototype[method] = OptionBased.prototype[method];
        }
    }
}
exports.OptionBased = OptionBased;
class OptionBuilderNested extends OptionBuilder {
    constructor(type, name, description) {
        super();
        this.type = type;
        this.name = name;
        this.description = description;
    }
    toJSON() {
        if (!this.type) {
            throw new TypeError('Property \'type\' is required');
        }
        if (!this.name) {
            throw new TypeError('Property \'name\' is required');
        }
        if (!this.description) {
            throw new TypeError('Property \'description\' is required');
        }
        return {
            type: this.type,
            name: this.name,
            description: this.description,
            options: this.options?.map(o => o.toJSON()) ?? [],
            required: this.required ? true : false,
        };
    }
}
exports.OptionBuilderNested = OptionBuilderNested;
OptionBased.applyTo(OptionBuilderNested);
