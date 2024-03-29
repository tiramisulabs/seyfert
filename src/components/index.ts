import { type APIMessageActionRowComponent, ButtonStyle, ComponentType } from 'discord-api-types/v10';
import { BaseComponent } from './BaseComponent';
import { ButtonComponent, LinkButtonComponent } from './ButtonComponent';
import { ChannelSelectMenuComponent } from './ChannelSelectMenuComponent';
import { MentionableSelectMenuComponent } from './MentionableSelectMenuComponent';
import { RoleSelectMenuComponent } from './RoleSelectMenuComponent';
import { StringSelectMenuComponent } from './StringSelectMenuComponent';
import type { TextInputComponent } from './TextInputComponent';
import { UserSelectMenuComponent } from './UserSelectMenuComponent';

export type MessageComponents =
	| ButtonComponent
	| LinkButtonComponent
	| RoleSelectMenuComponent
	| UserSelectMenuComponent
	| StringSelectMenuComponent
	| ChannelSelectMenuComponent
	| MentionableSelectMenuComponent
	| TextInputComponent;

export type ActionRowMessageComponents = Exclude<MessageComponents, TextInputComponent>;

export * from './command';
export * from './componentcontext';

/**
 * Return a new component instance based on the component type.
 *
 * @param component The component to create.
 * @returns The component instance.
 */
export function componentFactory(
	component: APIMessageActionRowComponent,
): ActionRowMessageComponents | BaseComponent<ActionRowMessageComponents['type']> {
	switch (component.type) {
		case ComponentType.Button:
			if (component.style === ButtonStyle.Link) {
				return new LinkButtonComponent(component);
			}
			return new ButtonComponent(component);
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
		default:
			return new BaseComponent<ActionRowMessageComponents['type']>(component);
	}
}
