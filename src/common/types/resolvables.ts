import type { Attachment, AttachmentBuilder, AttachmentDataType, AttachmentResolvable } from '../../builders';
import type { GuildMember } from '../../structures';
import type { APIGuildMember, APIPartialEmoji, RESTPostAPIApplicationEmojiJSONBody } from '../../types';
import type { EmbedColors, OmitInsert } from '..';

export type EmojiResolvable = string | Partial<APIPartialEmoji> | `<${string | undefined}:${string}:${string}>`;
export type GuildMemberResolvable = string | Partial<GuildMember> | APIGuildMember;
export type ColorResolvable = `#${string}` | number | keyof typeof EmbedColors | 'Random' | [number, number, number];
export type ImageResolvable = { data: AttachmentResolvable; type: AttachmentDataType } | Attachment | AttachmentBuilder;
export type ApplicationEmojiResolvable = OmitInsert<
	RESTPostAPIApplicationEmojiJSONBody,
	'image',
	{ image: ImageResolvable }
>;
