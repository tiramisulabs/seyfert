import {
	type APISelectMenuOption,
	type APIStringSelectComponent,
	ApplicationCommandType,
	type ClientOptions,
	type CommandContext,
	type ComponentCommand,
	createIntegerOption,
	createStringOption,
	Declare,
	type ModalCommand,
	Options,
	RadioGroup,
	RadioGroupOption,
	StringSelectMenu,
	StringSelectOption,
	SubCommand,
} from 'seyfert';

declare function expectType<T>(value: T): void;

class ContractSubCommand extends SubCommand {
	name = 'contract-sub';
	description = 'Contract subcommand';
	run() {}
}

const lowercaseOptionContract = {
	username: createStringOption({
		description: 'User name',
		required: true,
	}),
	page: createIntegerOption({
		description: 'Page',
		required: false,
	}),
} as const;

Options(lowercaseOptionContract)(class LowercaseOptionsCommand {});

declare function lowercaseOptionsCommandContext(): CommandContext<typeof lowercaseOptionContract>;
expectType<string>(lowercaseOptionsCommandContext().options.username);
expectType<number | undefined>(lowercaseOptionsCommandContext().options.page);

Options({
	// @ts-expect-error option record keys must be lowercase
	UserName: createStringOption({
		description: 'User name',
	}),
});

Options([ContractSubCommand])(class ArrayOptionsCommand {});

Declare({ name: 'lowercase-name', description: 'Lowercase command name' })(class LowercaseNameCommand {});

Declare({
	// @ts-expect-error command name must be lowercase
	name: 'Uppercase',
	description: 'Uppercase command name',
})(class UppercaseNameCommand {});

Declare({ name: 'Context Menu', type: ApplicationCommandType.Message })(class ContextMenuNameCommand {});

const componentDefaultsContract = {
	components: {
		defaults: {
			onInternalError(_client, component, error) {
				expectType<ComponentCommand>(component);
				expectType<unknown | undefined>(error);
			},
		},
	},
} satisfies ClientOptions;
expectType<ClientOptions>(componentDefaultsContract);

const modalDefaultsContract = {
	modals: {
		defaults: {
			onInternalError(_client, modal, error) {
				expectType<ModalCommand>(modal);
				expectType<unknown | undefined>(error);
			},
		},
	},
} satisfies ClientOptions;
expectType<ClientOptions>(modalDefaultsContract);

const radioGroupOptionContract = new RadioGroupOption({ value: 'yes', label: 'Yes' });
expectType<RadioGroupOption>(
	radioGroupOptionContract.setLabel('Absolutely').setValue('absolutely').setDescription('Confirm choice').setDefault(),
);
const radioGroupContract = new RadioGroup().setCustomId('choice');
const secondRadioGroupOptionContract = new RadioGroupOption({ value: 'no', label: 'No' });
expectType<RadioGroup>(radioGroupContract.setOptions([radioGroupOptionContract, secondRadioGroupOptionContract]));
expectType<RadioGroup>(radioGroupContract.setOptions(radioGroupOptionContract, secondRadioGroupOptionContract));
// @ts-expect-error RadioGroupOption requires both value and label at construction.
new RadioGroupOption({ value: 'yes' });
// @ts-expect-error RadioGroupOption requires option data at construction.
new RadioGroupOption();

const rawStringSelectOptionContract = { label: 'General', value: 'general' } satisfies APISelectMenuOption;
const stringSelectMenuContract = new StringSelectMenu().setCustomId('topics');
expectType<StringSelectMenu>(stringSelectMenuContract.addOption(rawStringSelectOptionContract));
expectType<StringSelectMenu>(stringSelectMenuContract.addOption([rawStringSelectOptionContract]));
expectType<StringSelectMenu>(stringSelectMenuContract.setOptions([rawStringSelectOptionContract]));
expectType<StringSelectMenu>(
	stringSelectMenuContract.setOptions(
		new StringSelectOption({ label: 'News', value: 'news' }),
		rawStringSelectOptionContract,
	),
);
const typedStringSelectMenuContract = new StringSelectMenu<'general' | 'news'>().setOptions(
	{ label: 'General', value: 'general' },
	{ label: 'News', value: 'news' },
);
expectType<StringSelectOption[]>(typedStringSelectMenuContract.data.options);
expectType<APIStringSelectComponent<'general' | 'news'>>(typedStringSelectMenuContract.toJSON());
expectType<APISelectMenuOption<'general' | 'news'>[]>(typedStringSelectMenuContract.toJSON().options);
// @ts-expect-error typed StringSelectMenu rejects raw options outside the configured value union.
new StringSelectMenu<'general'>({ options: [{ label: 'News', value: 'news' }] });
