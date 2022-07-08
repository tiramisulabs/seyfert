import type { Session } from "./deps.ts";

export class Collection<K, V> extends Map<K, V> {
    constructor(session: Session, entries: Iterable<readonly [K, V]>) {
        super(entries);

        this.session = session;
    }

    /** Reference to a session */
    readonly session: Session;
}

export default Collection;
