import type {
	CommandContext,
	ComponentContext,
	EntryPointContext,
	MenuCommandContext,
	MessageCommandInteraction,
	ModalContext,
} from 'seyfert';

type PublicShape<T> = { [K in keyof T]: T[K] };

const commandContext: CommandContext = {} as PublicShape<CommandContext>;
const componentContext: ComponentContext<'Button'> = {} as PublicShape<ComponentContext<'Button'>>;
const entryPointContext: EntryPointContext = {} as PublicShape<EntryPointContext>;
const menuContext: MenuCommandContext<MessageCommandInteraction> = {} as PublicShape<
	MenuCommandContext<MessageCommandInteraction>
>;
const modalContext: ModalContext = {} as PublicShape<ModalContext>;

void commandContext;
void componentContext;
void entryPointContext;
void menuContext;
void modalContext;
