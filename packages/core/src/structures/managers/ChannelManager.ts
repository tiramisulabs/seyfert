import { APIChannel } from "discord-api-types/v10";
import { Session } from "../../session";

export class ChannelManager {
	readonly session!: Session;
	constructor(session: Session) {
		Object.defineProperty(this, "session", {
			value: session,
			writable: false,
		});
	}

	async fetch(id: string): Promise<APIChannel> {
		return this.session.api.channels(id).get();
	}
}
