import type { DiscordSticker, DiscordStickerPack, StickerFormatTypes, StickerTypes } from "../../discordeno/mod.ts";
import { Model } from "./Base.ts";
import type { Snowflake } from "../Snowflake.ts";
import type { Session } from "../Session.ts";
import { User } from "./User.ts";
import * as Routes from "../Routes.ts";

export interface StickerItem {
    id: Snowflake;
    name: string;
    formatType: StickerFormatTypes;
}

export interface StickerPack {
    id: Snowflake;
    stickers: Sticker[];
    name: string;
    skuId: Snowflake;
    coverStickerId?: Snowflake;
    description: string;
    bannerAssetId?: Snowflake;
}

export class Sticker implements Model {
    constructor(session: Session, data: DiscordSticker) {
        this.session = session;
        this.id = data.id;
        this.packId = data.pack_id;
        this.name = data.name;
        this.description = data.description;
        this.tags = data.tags.split(",");
        this.type = data.type;
        this.formatType = data.format_type;
        this.available = !!data.available;
        this.guildId = data.guild_id;
        this.user = data.user ? new User(this.session, data.user) : undefined;
        this.sortValue = data.sort_value;
    }
    session: Session;
    id: Snowflake;
    packId?: Snowflake;
    name: string;
    description?: string;
    tags: string[];
    type: StickerTypes;
    formatType: StickerFormatTypes;
    available?: boolean;
    guildId?: Snowflake;
    user?: User;
    sortValue?: number;

    async fetchPremiumPack(): Promise<StickerPack> {
        const data = await this.session.rest.runMethod<DiscordStickerPack>(
            this.session.rest,
            "GET",
            Routes.STICKER_PACKS(),
        );
        return {
            id: data.id,
            stickers: data.stickers.map((st) => new Sticker(this.session, st)),
            name: data.name,
            skuId: data.sku_id,
            coverStickerId: data.cover_sticker_id,
            description: data.description,
            bannerAssetId: data.banner_asset_id,
        };
    }
}
