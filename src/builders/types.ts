import type {
	ComponentInteraction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
} from '../structures/Interaction';
import type { Button } from './Button';
import type { TextInput } from './Modal';
import type { BuilderSelectMenus } from './SelectMenu';

export type ComponentCallback<
	T extends ComponentInteraction | StringSelectMenuInteraction = ComponentInteraction | StringSelectMenuInteraction,
> = (interaction: T, stop: ComponentStopCallback, refresh: ComponentRefreshCallback) => any;
export type ComponentFilterCallback<T = ComponentInteraction> = (interaction: T) => any;
export type ComponentStopCallback = (reason?: string, refresh?: ComponentRefreshCallback) => any;
export type ComponentRefreshCallback = () => any;
export type ModalSubmitCallback<T = ModalSubmitInteraction> = (interaction: T) => any;
export type ButtonLink = Omit<Button, 'setCustomId'>;
export type ButtonID = Omit<Button, 'setURL'>;

export type MessageBuilderComponents = FixedComponents<Button> | BuilderSelectMenus;
export type ModalBuilderComponents = TextInput;
export type BuilderComponents = MessageBuilderComponents | TextInput;
export type FixedComponents<T = Button> = T extends Button ? ButtonLink | ButtonID : T;
export interface ListenerOptions {
	timeout?: number;
	idle?: number;
	filter?: ComponentFilterCallback;
	onStop?: ComponentStopCallback;
}
