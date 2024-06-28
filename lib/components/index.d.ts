import { type APIMessageActionRowComponent } from 'discord-api-types/v10';
import { BaseComponent } from './BaseComponent';
import { ButtonComponent, LinkButtonComponent, SKUButtonComponent } from './ButtonComponent';
import { ChannelSelectMenuComponent } from './ChannelSelectMenuComponent';
import { MentionableSelectMenuComponent } from './MentionableSelectMenuComponent';
import { RoleSelectMenuComponent } from './RoleSelectMenuComponent';
import { StringSelectMenuComponent } from './StringSelectMenuComponent';
import type { TextInputComponent } from './TextInputComponent';
import { UserSelectMenuComponent } from './UserSelectMenuComponent';
export type MessageComponents = ButtonComponent | LinkButtonComponent | SKUButtonComponent | RoleSelectMenuComponent | UserSelectMenuComponent | StringSelectMenuComponent | ChannelSelectMenuComponent | MentionableSelectMenuComponent | TextInputComponent;
export type ActionRowMessageComponents = Exclude<MessageComponents, TextInputComponent>;
export * from './componentcommand';
export * from './componentcontext';
export * from './modalcommand';
export * from './modalcontext';
/**
 * Return a new component instance based on the component type.
 *
 * @param component The component to create.
 * @returns The component instance.
 */
export declare function componentFactory(component: APIMessageActionRowComponent): ActionRowMessageComponents | BaseComponent<ActionRowMessageComponents['type']>;
