import type { FileUploadType, Snowflake } from '../../../../index';
import type { APIApplicationCommandOptionBase, APIInteractionDataOptionBase } from './base';
import type { ApplicationCommandOptionType } from './shared';

export type APIApplicationCommandAttachmentOption =
	APIApplicationCommandOptionBase<ApplicationCommandOptionType.Attachment> & {
		/** File types to accept; can contain media groups or dot-prefixed file extensions (maximum of 10) */
		file_types?: FileUploadType[];
	};

export type APIApplicationCommandInteractionDataAttachmentOption = APIInteractionDataOptionBase<
	ApplicationCommandOptionType.Attachment,
	Snowflake
>;
