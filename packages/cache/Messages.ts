import type { DiscordMessage, Session } from "./deps.ts";
import { Message } from "./deps.ts";
import { Collection } from "./Collection.ts";

export class CachedMessage extends Message {
    constructor(session: Session, data: DiscordMessage) {
        super(session, data);

        CachedMessage.from(this);
    }

    _id!: bigint;

    static from(message: Message): CachedMessage {
        const target: CachedMessage = Object.assign(message, { _id: BigInt(message.id) });

        Object.defineProperty(target, "id", {
            get(this: CachedMessage) {
                return String(this._id);
            }
        });

        return target;
    }
}

export class MessageCache extends Collection<bigint, CachedMessage> {
    constructor(session: Session, entries: Iterable<readonly [bigint, Message]>) {
        super(session, entries);
    }

    async fetch(channelId: bigint, id: bigint) {
        const message = this.get(id) ?? await Message.prototype.fetch.call({
            session: this.session,
            channelId: String(channelId),
            id: String(id)
        });

        return CachedMessage.from(message);
    }
}

export default MessageCache;
