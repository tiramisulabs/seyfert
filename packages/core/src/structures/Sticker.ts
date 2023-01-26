import type {
	APISticker,
	StickerFormatType,
	StickerType
} from 'discord-api-types/v10';
import type { Session } from '../session';
import { Base } from './extra/base';
import { User } from './User';

export class Sticker extends Base {
	constructor(session: Session, data: APISticker) {
		super(session, data.id);

		this.name = data.name;
		this.description = data.description?.length ? data.description : undefined;
		this.tags = data.tags.split(',');
		this.type = data.type;
		this.formatType = data.format_type;
		this.packId = data.pack_id;
		this.available = !!data.available;
		this.guildId = data.guild_id;
		this.sortValue = data.sort_value;

		if (data.user) {
			this.user = new User(this.session, data.user);
		}
	}

	/**	name of the sticker */
	name: string;

	/** description of the sticker */
	description: string | undefined;

	/** autocomplete/suggestion tags for the sticker (max 200 characters) */
	tags: string[];

	/** type of sticker */
	type: StickerType;

	/** type of sticker format */
	formatType: StickerFormatType;

	/** for standard stickers, id of the pack the sticker is from */
	packId?: string;

	/**	whether this guild sticker can be used, may be false due to loss of Server Boosts */
	available?: boolean;

	/** id of the guild that owns this sticker */
	guildId?: string;

	/**	the user that uploaded the guild sticker */
	user?: User;

	/** the standard sticker's sort order within its pack */
	sortValue?: number;
}
