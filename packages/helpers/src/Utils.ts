import {
  APIMessageActionRowComponent,
  APIModalActionRowComponent,
  ComponentType,
  PermissionFlagsBits
} from '@biscuitland/common';
import {
  ChannelSelectMenu,
  MentionableSelectMenu,
  MessageButton,
  ModalTextInput,
  RoleSelectMenu,
  StringSelectMenu,
  UserSelectMenu
} from './components';
import { BaseComponent } from './components/BaseComponent';

export function createComponent(data: APIMessageActionRowComponent): HelperComponents;
export function createComponent(data: APIModalActionRowComponent): HelperComponents;
export function createComponent(data: HelperComponents): HelperComponents;
export function createComponent(
  data: HelperComponents | APIMessageActionRowComponent | APIModalActionRowComponent
): HelperComponents {
  if (data instanceof BaseComponent) {
    return data;
  }

  switch (data.type) {
    case ComponentType.Button:
      return new MessageButton(data);
    case ComponentType.StringSelect:
      return new StringSelectMenu(data);
    case ComponentType.TextInput:
      return new ModalTextInput(data);
    case ComponentType.UserSelect:
      return new UserSelectMenu(data);
    case ComponentType.RoleSelect:
      return new RoleSelectMenu(data);
    case ComponentType.MentionableSelect:
      return new MentionableSelectMenu(data);
    case ComponentType.ChannelSelect:
      return new ChannelSelectMenu(data);
  }
}

export type PermissionsStrings = `${keyof typeof PermissionFlagsBits}`;
export type OptionValuesLength = { max: number; min: number };
export type MessageSelectMenus =
  | RoleSelectMenu
  | UserSelectMenu
  | StringSelectMenu
  | ChannelSelectMenu
  | MentionableSelectMenu;
export type MessageComponents = MessageButton | MessageSelectMenus;
export type HelperComponents = MessageComponents | ModalTextInput;
