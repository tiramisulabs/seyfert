import type { DiscordUser, Session } from "./deps.ts";
import { User } from "./deps.ts";
import { Collection } from "./Collection.ts";

export class CachedUser extends User {
    constructor(session: Session, data: DiscordUser) {
        super(session, data);

        CachedUser.from(this);
    }

    _id!: bigint;

    static from(user: User): CachedUser {
        const target: CachedUser = Object.assign(user, { _id: BigInt(user.id) });

        Object.defineProperty(target, "id", {
            get(this: CachedUser) {
                return String(this._id);
            }
        });

        return target;
    }
}

export class UserCache extends Collection<bigint, CachedUser> {
    constructor(session: Session, entries: Iterable<readonly [bigint, User]>) {
        super(session, entries);
    }
}

export default UserCache;
