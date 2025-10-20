import type {
	ComponentInteraction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
} from '../structures/Interaction';
import type { ActionRow } from './ActionRow';
import type { Button } from './Button';
import type { Container } from './Container';
import type { File } from './File';
import { FileUpload } from './FileUpload';
import { Label } from './Label';
import type { MediaGallery } from './MediaGallery';
import type { TextInput } from './Modal';
import type { Section } from './Section';
import type { BuilderSelectMenus } from './SelectMenu';
import type { Separator } from './Separator';
import type { TextDisplay } from './TextDisplay';
import type { Thumbnail } from './Thumbnail';

export type ComponentCallback<
	T extends ComponentInteraction | StringSelectMenuInteraction = ComponentInteraction | StringSelectMenuInteraction,
> = (interaction: T, stop: ComponentStopCallback, refresh: ComponentRefreshCallback) => any;
export type ComponentOnErrorCallback<
	T extends ComponentInteraction | StringSelectMenuInteraction = ComponentInteraction | StringSelectMenuInteraction,
> = (interaction: T, error: unknown, stop: ComponentStopCallback, refresh: ComponentRefreshCallback) => any;
export type ComponentFilterCallback<T = ComponentInteraction> = (interaction: T) => any;
export type ComponentOnStopCallback = (
	reason: 'messageDelete' | 'channelDelete' | 'guildDelete' | 'idle' | 'timeout' | (string & {}) | undefined,
	refresh: ComponentRefreshCallback,
) => any;
export type ComponentStopCallback = (
	reason: 'messageDelete' | 'channelDelete' | 'guildDelete' | 'idle' | 'timeout' | (string & {}) | undefined,
) => any;
export type ComponentRefreshCallback = () => any;
export type ModalSubmitCallback<T = ModalSubmitInteraction> = (interaction: T) => any;
export type ButtonLink = Omit<Button, 'setCustomId'>;
export type ButtonID = Omit<Button, 'setURL'>;

export type MessageBuilderComponents = Exclude<TopLevelBuilders, Label>;
export type ModalBuilderComponents = Label | TextDisplay;
export type ActionBuilderComponents = Button | BuilderSelectMenus;

export type BuilderComponents =
	| ActionRow
	| BuilderSelectMenus
	| Button
	| Section<Button | Thumbnail>
	| Thumbnail
	| TextDisplay
	| Container
	| Separator
	| MediaGallery
	| File
	| TextInput
	| Label
	| FileUpload;

export type TopLevelBuilders = Exclude<BuilderComponents, Thumbnail | TextInput | Button | BuilderSelectMenus>;

export type FixedComponents<T = Button> = T extends Button ? ButtonLink | ButtonID : T;
export interface ListenerOptions {
	timeout?: number;
	idle?: number;
	filter?: ComponentFilterCallback;
	onPass?: ComponentFilterCallback;
	onStop?: ComponentOnStopCallback;
	onError?: ComponentOnErrorCallback;
}
