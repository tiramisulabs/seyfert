import type { APIPartialEmoji } from 'discord-api-types/v10';
import type { EmbedColors } from '..';
import type { Attachment, AttachmentDataType, AttachmentResolvable } from '../../builders';
import type { GuildMember } from '../../structures';

export type EmojiResolvable = string | Partial<APIPartialEmoji> | `<${string | undefined}:${string}:${string}>`;
export type GuildMemberResolvable = string | Partial<GuildMember>;
export type ColorResolvable = `#${string}` | number | keyof typeof EmbedColors | 'Random' | [number, number, number];
export type ImageResolvable = { data: AttachmentResolvable; type: AttachmentDataType } | Attachment;
