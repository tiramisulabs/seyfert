import { type APIComponents, ComponentType } from '../types';
import { ActionRow } from './ActionRow';
import { Button } from './Button';
import { TextInput } from './Modal';
import { Section } from './Section';
import {
	ChannelSelectMenu,
	MentionableSelectMenu,
	RoleSelectMenu,
	StringSelectMenu,
	UserSelectMenu,
} from './SelectMenu';
import { TextDisplay } from './TextDisplay';
import { Thumbnail } from './Thumbnail';
import type { ActionBuilderComponents, BuilderComponents } from './types';

export * from './ActionRow';
export * from './Attachment';
export * from './Base';
export * from './Button';
export * from './Embed';
export * from './Modal';
export * from './SelectMenu';
export * from './Poll';
export * from './types';
export * from './Container';
export * from './File';
export * from './Section';
export * from './MediaGallery';
export * from './Separator';
export * from './TextDisplay';
export * from './Thumbnail';

export function fromComponent(
	data: BuilderComponents | APIComponents | ActionRow<ActionBuilderComponents>,
): BuilderComponents {
	if ('toJSON' in data) {
		return data;
	}
	switch (data.type) {
		case ComponentType.Button:
			return new Button(data);
		case ComponentType.StringSelect:
			return new StringSelectMenu(data);
		case ComponentType.TextInput:
			return new TextInput(data);
		case ComponentType.UserSelect:
			return new UserSelectMenu(data);
		case ComponentType.RoleSelect:
			return new RoleSelectMenu(data);
		case ComponentType.MentionableSelect:
			return new MentionableSelectMenu(data);
		case ComponentType.ChannelSelect:
			return new ChannelSelectMenu(data);
		case ComponentType.ActionRow:
			return new ActionRow(data);
		case ComponentType.Section:
			return new Section(data);
		case ComponentType.TextDisplay:
			return new TextDisplay(data);
		case ComponentType.Thumbnail:
			return new Thumbnail(data);
	}
	return {} as any;
}
