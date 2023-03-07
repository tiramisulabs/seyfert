import type {
	ChannelSelectMenuComponent,
	ImageFormat,
	LinkButtonComponent,
	MentionableSelectMenuComponent,
	RoleSelectMenuComponent,
	StringSelectMenuComponent,
	TextInputComponent,
	UserSelectMenuComponent,
} from "../index";
import { DMChannel, ButtonComponent } from "../index";
import { BaseChannel } from "../structures/extra/BaseChannel";

export type BiscuitComponents =
	| ButtonComponent
	| LinkButtonComponent
	| RoleSelectMenuComponent
	| UserSelectMenuComponent
	| StringSelectMenuComponent
	| ChannelSelectMenuComponent
	| MentionableSelectMenuComponent
	| TextInputComponent;

export type BiscuitActionRowMessageComponents = Exclude<BiscuitComponents, TextInputComponent>;

export type EditNickname = { nick?: string; reason?: string };

/**
 * @link https://discord.com/developers/docs/reference#image-formatting
 */
export type ImageSize = 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
export type ImageOptions = {
	format?: ImageFormat;
	size?: ImageSize;
};

export type BiscuitChannels = DMChannel | BaseChannel;

export enum ThreadTypes {
	AnnouncementThread = 10,
	PublicThread = 11,
	PrivateThread = 12,
}
