import {
	type ActionRow,
	type Button,
	type ChannelSelectMenu,
	type Container,
	type File,
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
import { Label } from '../builders/Label';
import {
	type APIActionRowComponent,
	type APIActionRowComponentTypes,
	type APIButtonComponent,
	type APIChannelSelectComponent,
	type APIContainerComponent,
	type APIFileComponent,
	type APILabelComponent,
	type APIMediaGalleryComponent,
	type APIMentionableSelectComponent,
	type APIRoleSelectComponent,
	type APISectionComponent,
	type APISeparatorComponent,
	type APIStringSelectComponent,
	type APITextDisplayComponent,
	type APITextInputComponent,
	type APIThumbnailComponent,
	type APIUserSelectComponent,
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
}
