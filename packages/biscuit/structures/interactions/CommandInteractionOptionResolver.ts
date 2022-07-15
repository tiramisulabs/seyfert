import type { DiscordInteractionDataOption, DiscordInteractionDataResolved } from "../../../discordeno/mod.ts";
import { ApplicationCommandOptionTypes } from "../../../discordeno/mod.ts";

export function transformOasisInteractionDataOption(o: DiscordInteractionDataOption): CommandInteractionOption {
    const output: CommandInteractionOption = { ...o, Otherwise: o.value as string | boolean | number | undefined };

    switch (o.type) {
        case ApplicationCommandOptionTypes.String:
            output.String = o.value as string;
            break;
        case ApplicationCommandOptionTypes.Number:
            output.Number = o.value as number;
            break;
        case ApplicationCommandOptionTypes.Integer:
            output.Integer = o.value as number;
            break;
        case ApplicationCommandOptionTypes.Boolean:
            output.Boolean = o.value as boolean;
            break;
        case ApplicationCommandOptionTypes.Role:
            output.Role = BigInt(o.value as string);
            break;
        case ApplicationCommandOptionTypes.User:
            output.User = BigInt(o.value as string);
            break;
        case ApplicationCommandOptionTypes.Channel:
            output.Channel = BigInt(o.value as string);
            break;

        case ApplicationCommandOptionTypes.Mentionable:
        case ApplicationCommandOptionTypes.SubCommand:
        case ApplicationCommandOptionTypes.SubCommandGroup:
        default:
            output.Otherwise = o.value as string | boolean | number | undefined;
    }

    return output;
}

export interface CommandInteractionOption extends Omit<DiscordInteractionDataOption, "value"> {
    Attachment?: string;
    Boolean?: boolean;
    User?: bigint;
    Role?: bigint;
    Number?: number;
    Integer?: number;
    Channel?: bigint;
    String?: string;
    Mentionable?: string;
    Otherwise: string | number | boolean | bigint | undefined;
}

/**
 * Utility class to get the resolved options for a command
 * It is really typesafe
 * @example const option = ctx.options.getStringOption("name");
 */
export class CommandInteractionOptionResolver {
    #subcommand?: string;
    #group?: string;

    hoistedOptions: CommandInteractionOption[];
    resolved?: DiscordInteractionDataResolved;

    constructor(options?: DiscordInteractionDataOption[], resolved?: DiscordInteractionDataResolved) {
        this.hoistedOptions = options?.map(transformOasisInteractionDataOption) ?? [];

        // warning: black magic do not edit and thank djs authors

        if (this.hoistedOptions[0]?.type === ApplicationCommandOptionTypes.SubCommandGroup) {
            this.#group = this.hoistedOptions[0].name;
            this.hoistedOptions = (this.hoistedOptions[0].options ?? []).map(transformOasisInteractionDataOption);
        }

        if (this.hoistedOptions[0]?.type === ApplicationCommandOptionTypes.SubCommand) {
            this.#subcommand = this.hoistedOptions[0].name;
            this.hoistedOptions = (this.hoistedOptions[0].options ?? []).map(transformOasisInteractionDataOption);
        }

        this.resolved = resolved;
    }

    private getTypedOption(
        name: string | number,
        type: ApplicationCommandOptionTypes,
        properties: Array<keyof CommandInteractionOption>,
        required: boolean,
    ): CommandInteractionOption | void {
        const option: (CommandInteractionOption | undefined) = this.get(name, required);

        if (!option) {
            return;
        }

        if (option.type !== type) {
            // pass
        }

        if (required === true && properties.every((prop) => typeof option[prop] === "undefined")) {
            throw new TypeError(`Properties ${properties.join(", ")} are missing in option ${name}`);
        }

        return option;
    }

    get(name: string | number, required: true): CommandInteractionOption;
    get(name: string | number, required: boolean): CommandInteractionOption | undefined;
    get(name: string | number, required?: boolean) {
        const option: (CommandInteractionOption | undefined) = this.hoistedOptions.find((o) =>
            typeof name === "number" ? o.name === name.toString() : o.name === name
        );

        if (!option) {
            if (required && name in this.hoistedOptions.map((o) => o.name)) {
                throw new TypeError("Option marked as required was undefined");
            }

            return;
        }

        return option;
    }

    /** searches for a string option */
    getString(name: string | number, required: true): string;
    getString(name: string | number, required?: boolean): string | undefined;
    getString(name: string | number, required = false) {
        const option: (CommandInteractionOption | void) = this.getTypedOption(name, ApplicationCommandOptionTypes.String, ["Otherwise"], required);

        return option?.Otherwise ?? undefined;
    }

    /** searches for a number option */
    getNumber(name: string | number, required: true): number;
    getNumber(name: string | number, required?: boolean): number | undefined;
    getNumber(name: string | number, required = false) {
        const option: (CommandInteractionOption | void) = this.getTypedOption(name, ApplicationCommandOptionTypes.Number, ["Otherwise"], required);

        return option?.Otherwise ?? undefined;
    }

    /** searhces for an integer option */
    getInteger(name: string | number, required: true): number;
    getInteger(name: string | number, required?: boolean): number | undefined;
    getInteger(name: string | number, required = false) {
        const option: (CommandInteractionOption | void) = this.getTypedOption(name, ApplicationCommandOptionTypes.Integer, ["Otherwise"], required);

        return option?.Otherwise ?? undefined;
    }

    /** searches for a boolean option */
    getBoolean(name: string | number, required: true): boolean;
    getBoolean(name: string | number, required?: boolean): boolean | undefined;
    getBoolean(name: string | number, required = false) {
        const option: (CommandInteractionOption | void) = this.getTypedOption(name, ApplicationCommandOptionTypes.Boolean, ["Otherwise"], required);

        return option?.Otherwise ?? undefined;
    }

    /** searches for a user option */
    getUser(name: string | number, required: true): bigint;
    getUser(name: string | number, required?: boolean): bigint | undefined;
    getUser(name: string | number, required = false) {
        const option: (CommandInteractionOption | void) = this.getTypedOption(name, ApplicationCommandOptionTypes.User, ["Otherwise"], required);

        return option?.Otherwise ?? undefined;
    }

    /** searches for a channel option */
    getChannel(name: string | number, required: true): bigint;
    getChannel(name: string | number, required?: boolean): bigint | undefined;
    getChannel(name: string | number, required = false) {
        const option: (CommandInteractionOption | void) = this.getTypedOption(name, ApplicationCommandOptionTypes.Channel, ["Otherwise"], required);

        return option?.Otherwise ?? undefined;
    }

    /** searches for a mentionable-based option */
    getMentionable(name: string | number, required: true): string;
    getMentionable(name: string | number, required?: boolean): string | undefined;
    getMentionable(name: string | number, required = false) {
        const option: (CommandInteractionOption | void) = this.getTypedOption(name, ApplicationCommandOptionTypes.Mentionable, ["Otherwise"], required);

        return option?.Otherwise ?? undefined;
    }

    /** searches for a mentionable-based option */
    getRole(name: string | number, required: true): bigint;
    getRole(name: string | number, required?: boolean): bigint | undefined;
    getRole(name: string | number, required = false) {
        const option: (CommandInteractionOption | void) = this.getTypedOption(name, ApplicationCommandOptionTypes.Role, ["Otherwise"], required);

        return option?.Otherwise ?? undefined;
    }

    /** searches for an attachment option */
    getAttachment(name: string | number, required: true): string;
    getAttachment(name: string | number, required?: boolean): string | undefined;
    getAttachment(name: string | number, required = false) {
        const option: (CommandInteractionOption | void) = this.getTypedOption(name, ApplicationCommandOptionTypes.Attachment, ["Otherwise"], required);

        return option?.Otherwise ?? undefined;
    }

    /** searches for the focused option */
    getFocused(full = false): string | number | bigint | boolean | undefined | CommandInteractionOption {
        const focusedOption: (CommandInteractionOption | void) = this.hoistedOptions.find((option) => option.focused);

        if (!focusedOption) {
            throw new TypeError("No option found");
        }

        return full ? focusedOption : focusedOption.Otherwise;
    }

    getSubCommand(required = true): (string | CommandInteractionOption[] | undefined)[] {
        if (required && !this.#subcommand) {
            throw new TypeError("Option marked as required was undefined");
        }

        return [this.#subcommand, this.hoistedOptions];
    }

    getSubCommandGroup(required = false): (string | CommandInteractionOption[] | undefined)[] {
        if (required && !this.#group) {
            throw new TypeError("Option marked as required was undefined");
        }

        return [this.#group, this.hoistedOptions];
    }
}

export default CommandInteractionOptionResolver;
