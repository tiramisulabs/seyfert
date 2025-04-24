import { type APIComponents, type APITopLevelComponent, ButtonStyle, ComponentType } from '../types';
import { MessageActionRowComponent } from './ActionRow';
import { BaseComponent } from './BaseComponent';
import { ButtonComponent, LinkButtonComponent, SKUButtonComponent } from './ButtonComponent';
import { ChannelSelectMenuComponent } from './ChannelSelectMenuComponent';
import { ContainerComponent } from './Container';
import { FileComponent } from './File';
import { MediaGalleryComponent } from './MediaGallery';
import { MentionableSelectMenuComponent } from './MentionableSelectMenuComponent';
import { RoleSelectMenuComponent } from './RoleSelectMenuComponent';
import { SectionComponent } from './Section';
import type { SeparatorComponent } from './Separator';
import { StringSelectMenuComponent } from './StringSelectMenuComponent';
import { TextDisplayComponent } from './TextDisplay';
import type { TextInputComponent } from './TextInputComponent';
import { UserSelectMenuComponent } from './UserSelectMenuComponent';

export type MessageComponents =
	| ButtonComponent
	| LinkButtonComponent
	| SKUButtonComponent
	| RoleSelectMenuComponent
	| UserSelectMenuComponent
	| StringSelectMenuComponent
	| ChannelSelectMenuComponent
	| MentionableSelectMenuComponent
	| TextInputComponent;

export type ActionRowMessageComponents = Exclude<MessageComponents, TextInputComponent>;

export type AllComponents = MessageComponents | TopLevelComponents | ContainerComponents | BaseComponent<ComponentType>;

export * from './componentcommand';
export * from './componentcontext';
export * from './modalcommand';
export * from './modalcontext';

export type TopLevelComponents =
	| SectionComponent
	| ActionRowMessageComponents
	| TextDisplayComponent
	| ContainerComponent
	| FileComponent
	| MediaGalleryComponent
	| BaseComponent<APITopLevelComponent['type']>;

export type ContainerComponents =
	| ActionRowMessageComponents
	| TextDisplayComponent
	| MediaGalleryComponent
	| SectionComponent
	| SeparatorComponent
	| FileComponent;

/**
 * Return a new component instance based on the component type.
 *
 * @param component The component to create.
 * @returns The component instance.
 */
export function componentFactory(component: APIComponents): AllComponents {
	switch (component.type) {
		case ComponentType.Button: {
			if (component.style === ButtonStyle.Link) {
				return new LinkButtonComponent(component);
			}
			if (component.style === ButtonStyle.Premium) {
				return new SKUButtonComponent(component);
			}
			return new ButtonComponent(component);
		}
		case ComponentType.ChannelSelect:
			return new ChannelSelectMenuComponent(component);
		case ComponentType.RoleSelect:
			return new RoleSelectMenuComponent(component);
		case ComponentType.StringSelect:
			return new StringSelectMenuComponent(component);
		case ComponentType.UserSelect:
			return new UserSelectMenuComponent(component);
		case ComponentType.MentionableSelect:
			return new MentionableSelectMenuComponent(component);
		case ComponentType.ActionRow:
			return new MessageActionRowComponent(component as any);
		case ComponentType.Container:
			return new ContainerComponent(component);
		case ComponentType.File:
			return new FileComponent(component);
		case ComponentType.MediaGallery:
			return new MediaGalleryComponent(component);
		case ComponentType.Section:
			return new SectionComponent(component);
		case ComponentType.TextDisplay:
			return new TextDisplayComponent(component);
		default:
			return new BaseComponent<ComponentType>(component);
	}
}
