import {
	type ActionRow,
	type Button,
	type ChannelSelectMenu,
	type Container,
	type File,
	type FileUpload,
	fromComponent,
	type MediaGallery,
	type MentionableSelectMenu,
	type RoleSelectMenu,
	type Section,
	type Separator,
	type StringSelectMenu,
	type TextDisplay,
	type TextInput,
	type Thumbnail,
	type UserSelectMenu,
} from '../builders';
import type { Label } from '../builders/Label';
import type {
	APIActionRowComponent,
	APIActionRowComponentTypes,
	APIButtonComponent,
	APIChannelSelectComponent,
	APIContainerComponent,
	APIFileComponent,
	APIFileUploadComponent,
	APILabelComponent,
	APIMediaGalleryComponent,
	APIMentionableSelectComponent,
	APIRoleSelectComponent,
	APISectionComponent,
	APISeparatorComponent,
	APIStringSelectComponent,
	APITextDisplayComponent,
	APITextInputComponent,
	APIThumbnailComponent,
	APIUserSelectComponent,
	ComponentType,
} from '../types';

export class BaseComponent<T extends ComponentType> {
	constructor(public data: APIComponentsMap[T]) {}

	get type() {
		return this.data.type;
	}

	toJSON() {
		return this.data;
	}

	toBuilder() {
		return fromComponent(this.data) as BuilderComponentsMap[T];
	}
}
export interface APIComponentsMap {
	[ComponentType.ActionRow]: APIActionRowComponent<APIActionRowComponentTypes>;
	[ComponentType.Button]: APIButtonComponent;
	[ComponentType.ChannelSelect]: APIChannelSelectComponent;
	[ComponentType.MentionableSelect]: APIMentionableSelectComponent;
	[ComponentType.RoleSelect]: APIRoleSelectComponent;
	[ComponentType.StringSelect]: APIStringSelectComponent;
	[ComponentType.UserSelect]: APIUserSelectComponent;
	[ComponentType.TextInput]: APITextInputComponent;
	[ComponentType.File]: APIFileComponent;
	[ComponentType.Thumbnail]: APIThumbnailComponent;
	[ComponentType.Section]: APISectionComponent;
	[ComponentType.Container]: APIContainerComponent;
	[ComponentType.MediaGallery]: APIMediaGalleryComponent;
	[ComponentType.Separator]: APISeparatorComponent;
	[ComponentType.TextDisplay]: APITextDisplayComponent;
	[ComponentType.Label]: APILabelComponent;
	[ComponentType.FileUpload]: APIFileUploadComponent;
}

export interface BuilderComponentsMap {
	[ComponentType.ActionRow]: ActionRow;
	[ComponentType.Button]: Button;
	[ComponentType.ChannelSelect]: ChannelSelectMenu;
	[ComponentType.MentionableSelect]: MentionableSelectMenu;
	[ComponentType.RoleSelect]: RoleSelectMenu;
	[ComponentType.StringSelect]: StringSelectMenu;
	[ComponentType.UserSelect]: UserSelectMenu;
	[ComponentType.TextInput]: TextInput;
	[ComponentType.File]: File;
	[ComponentType.Thumbnail]: Thumbnail;
	[ComponentType.Section]: Section;
	[ComponentType.Container]: Container;
	[ComponentType.MediaGallery]: MediaGallery;
	[ComponentType.Separator]: Separator;
	[ComponentType.TextDisplay]: TextDisplay;
	[ComponentType.Label]: Label;
	[ComponentType.FileUpload]: FileUpload;
}
