import { type APIComponents, ComponentType } from '../types';
import { ActionRow } from './ActionRow';
import { Button } from './Button';
import { Container } from './Container';
import { File } from './File';
import { FileUpload } from './FileUpload';
import { Label } from './Label';
import { MediaGallery } from './MediaGallery';
import { TextInput } from './Modal';
import { Section } from './Section';
import {
	ChannelSelectMenu,
	MentionableSelectMenu,
	RoleSelectMenu,
	StringSelectMenu,
	UserSelectMenu,
} from './SelectMenu';
import { Separator } from './Separator';
import { TextDisplay } from './TextDisplay';
import { Thumbnail } from './Thumbnail';
import type { BuilderComponents } from './types';

export * from './ActionRow';
export * from './Attachment';
export * from './Base';
export * from './Button';
export * from './Container';
export * from './Embed';
export * from './File';
export * from './FileUpload';
export * from './MediaGallery';
export * from './Modal';
export * from './Poll';
export * from './Section';
export * from './SelectMenu';
export * from './Separator';
export * from './TextDisplay';
export * from './Thumbnail';
export * from './types';

export function fromComponent(data: BuilderComponents | APIComponents): BuilderComponents {
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
		case ComponentType.Container:
			return new Container(data);
		case ComponentType.MediaGallery:
			return new MediaGallery(data);
		case ComponentType.Separator:
			return new Separator(data);
		case ComponentType.File:
			return new File(data);
		case ComponentType.Label:
			return new Label(data);
		case ComponentType.FileUpload:
			return new FileUpload(data);
	}
}
