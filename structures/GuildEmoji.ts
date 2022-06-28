import type { Snowflake } from "../util/Snowflake.ts";
import type { Session } from "../session/Session.ts";
import type { DiscordEmoji } from "../vendor/external.ts";
import type { ModifyGuildEmoji } from "./Guild.ts";
import Guild from "./Guild.ts";
import Emoji from "./Emoji.ts";
import User from "./User.ts";
import * as Routes from "../util/Routes.ts";

export class GuildEmoji extends Emoji {
    constructor(session: Session, data: DiscordEmoji, guildId: Snowflake) {
        super(session, data);
        this.guildId = guildId;
        this.roles = data.roles;
        this.user = data.user ? new User(this.session, data.user) : undefined;
        this.managed = !!data.managed;
        this.id = super.id!;
    }
    guildId: Snowflake;
    roles?: Snowflake[];
    user?: User;
    managed?: boolean;
    // id cannot be null in a GuildEmoji
    override id: Snowflake;

    async edit(options: ModifyGuildEmoji): Promise<GuildEmoji> {
        const emoji = await Guild.prototype.editEmoji.call(
            { id: this.guildId, session: this.session },
            this.id,
            options,
        );

        return emoji;
    }

    async delete({ reason }: { reason?: string } = {}): Promise<GuildEmoji> {
        await Guild.prototype.deleteEmoji.call({ id: this.guildId, session: this.session }, this.id, { reason });

        return this;
    }

    get url() {
        return Routes.EMOJI_URL(this.id, this.animated);
    }
}

export default GuildEmoji;
