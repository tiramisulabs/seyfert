import type { Session } from "../Session.ts";
import type { DiscordReaction } from "../../discordeno/mod.ts";
import Emoji from "./Emoji.ts";

/**
 * Represents a reaction
 * @link https://discord.com/developers/docs/resources/channel#reaction-object
 */
export class MessageReaction {
    constructor(session: Session, data: DiscordReaction) {
        this.session = session;
        this.me = data.me;
        this.count = data.count;
        this.emoji = new Emoji(session, data.emoji);
    }

    readonly session: Session;
    me: boolean;
    count: number;
    emoji: Emoji;
}

export default MessageReaction;
