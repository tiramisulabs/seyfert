import type { Session } from "../../session";
/**
 *
 */
export abstract class Base {
	constructor(session: Session) {
		Object.defineProperty(this, "session", {
			value: session,
			writable: false,
		});
	}

	session!: Session;
}
