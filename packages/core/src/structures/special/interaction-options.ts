import type {
	DiscordInteractionDataOption,
	DiscordInteractionDataResolved,
    Snowflake,
} from '@biscuitland/api-types';
import { ApplicationCommandOptionTypes } from '@biscuitland/api-types';

/**
 * Utility class to get the resolved options for a command
 * @example const option = ctx.options.getStringOption("name");
 */
export class InteractionOptions {
	private _subcommand?: string;
	private _group?: string;

	hoistedOptions: DiscordInteractionDataOption[];
	resolved?: DiscordInteractionDataResolved;

	constructor(
		options?: DiscordInteractionDataOption[],
		resolved?: DiscordInteractionDataResolved
	) {
		this.hoistedOptions = options ?? [];

		// warning: black magic do not edit and thank djs authors

		if (
			this.hoistedOptions[0]?.type ===
			ApplicationCommandOptionTypes.SubCommandGroup
		) {
			this._group = this.hoistedOptions[0].name;
			this.hoistedOptions = this.hoistedOptions[0].options ?? [];
		}

		if (
			this.hoistedOptions[0]?.type ===
			ApplicationCommandOptionTypes.SubCommand
		) {
			this._subcommand = this.hoistedOptions[0].name;
			this.hoistedOptions = this.hoistedOptions[0].options ?? [];
		}

		this.resolved = resolved;
	}

	private getTypedOption(
		name: string | number,
		type: ApplicationCommandOptionTypes,
		properties: (keyof DiscordInteractionDataOption)[],
		required: boolean
	): DiscordInteractionDataOption | void {
		const option: DiscordInteractionDataOption | undefined = this.get(
			name,
			required
		);

		if (!option) {
			return;
		}

		if (option.type !== type) {
			// pass
		}

		if (
			required === true &&
			properties.every(prop => typeof option[prop] === 'undefined')
		) {
			throw new TypeError(
				`Properties ${properties.join(
					', '
				)} are missing in option ${name}`
			);
		}

		return option;
	}

	get(name: string | number, required: true): DiscordInteractionDataOption;
	get(
		name: string | number,
		required: boolean
	): DiscordInteractionDataOption | undefined;

	get(name: string | number, required?: boolean) {
		const option: DiscordInteractionDataOption | undefined =
			this.hoistedOptions.find(o =>
				typeof name === 'number'
					? o.name === name.toString()
					: o.name === name
			);

		if (!option) {
			if (required && name in this.hoistedOptions.map(o => o.name)) {
				throw new TypeError('Option marked as required was undefined');
			}

			return;
		}

		return option;
	}

	/** searches for a string option */
	getString(name: string | number, required: true): string;
	getString(name: string | number, required?: boolean): string | undefined;
	getString(name: string | number, required = false) {
		const option: DiscordInteractionDataOption | void = this.getTypedOption(
			name,
			ApplicationCommandOptionTypes.String,
			['value'],
			required
		);

		return option?.value ?? undefined;
	}

	/** searches for a number option */
	getNumber(name: string | number, required: true): number;
	getNumber(name: string | number, required?: boolean): number | undefined;
	getNumber(name: string | number, required = false) {
		const option: DiscordInteractionDataOption | void = this.getTypedOption(
			name,
			ApplicationCommandOptionTypes.Number,
			['value'],
			required
		);

		return option?.value ?? undefined;
	}

	/** searhces for an integer option */
	getInteger(name: string | number, required: true): number;
	getInteger(name: string | number, required?: boolean): number | undefined;
	getInteger(name: string | number, required = false) {
		const option: DiscordInteractionDataOption | void = this.getTypedOption(
			name,
			ApplicationCommandOptionTypes.Integer,
			['value'],
			required
		);

		return option?.value ?? undefined;
	}

	/** searches for a boolean option */
	getBoolean(name: string | number, required: true): boolean;
	getBoolean(name: string | number, required?: boolean): boolean | undefined;
	getBoolean(name: string | number, required = false) {
		const option: DiscordInteractionDataOption | void = this.getTypedOption(
			name,
			ApplicationCommandOptionTypes.Boolean,
			['value'],
			required
		);

		return option?.value ?? undefined;
	}

	/** searches for a user option */
	getUser(name: string | number, required: true): Snowflake;
	getUser(name: string | number, required?: boolean): Snowflake | undefined;
	getUser(name: string | number, required = false) {
		const option: DiscordInteractionDataOption | void = this.getTypedOption(
			name,
			ApplicationCommandOptionTypes.User,
			['value'],
			required
		);

		return option?.value ?? undefined;
	}

	/** searches for a channel option */
	getChannel(name: string | number, required: true): Snowflake;
	getChannel(name: string | number, required?: boolean): Snowflake | undefined;
	getChannel(name: string | number, required = false) {
		const option: DiscordInteractionDataOption | void = this.getTypedOption(
			name,
			ApplicationCommandOptionTypes.Channel,
			['value'],
			required
		);

		return option?.value ?? undefined;
	}

	/** searches for a mentionable-based option */
	getMentionable(name: string | number, required: true): string;
	getMentionable(
		name: string | number,
		required?: boolean
	): string | undefined;

	getMentionable(name: string | number, required = false) {
		const option: DiscordInteractionDataOption | void = this.getTypedOption(
			name,
			ApplicationCommandOptionTypes.Mentionable,
			['value'],
			required
		);

		return option?.value ?? undefined;
	}

	/** searches for a mentionable-based option */
	getRole(name: string | number, required: true): Snowflake;
	getRole(name: string | number, required?: boolean): Snowflake | undefined;
	getRole(name: string | number, required = false) {
		const option: DiscordInteractionDataOption | void = this.getTypedOption(
			name,
			ApplicationCommandOptionTypes.Role,
			['value'],
			required
		);

		return option?.value ?? undefined;
	}

	/** searches for an attachment option */
	getAttachment(name: string | number, required: true): Snowflake;
	getAttachment(name: string | number, required?: boolean): Snowflake | undefined;
	getAttachment(name: string | number, required = false) {
		const option: DiscordInteractionDataOption | void = this.getTypedOption(
			name,
			ApplicationCommandOptionTypes.Attachment,
			['value'],
			required
		);

		return option?.value ?? undefined;
	}

	/** searches for the focused option */
    getFocused(full: true): DiscordInteractionDataOption;
    getFocused(full: false): DiscordInteractionDataOption['value'];
	getFocused(full = false) {
		const focusedOption: DiscordInteractionDataOption | void =
			this.hoistedOptions.find(option => option.focused);

		if (!focusedOption) {
			throw new TypeError('No option found');
		}

		return full ? focusedOption : focusedOption.value;
	}

	getSubCommand(
		required = true
	): [string | undefined, DiscordInteractionDataOption[]] {
		if (required && !this._subcommand) {
			throw new TypeError('Option marked as required was undefined');
		}

		return [this._subcommand, this.hoistedOptions];
	}

	getSubCommandGroup(
		required = false
	): [string | undefined, DiscordInteractionDataOption[]] {
		if (required && !this._group) {
			throw new TypeError('Option marked as required was undefined');
		}

		return [this._group, this.hoistedOptions];
	}
}
