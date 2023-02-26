import { APIDMChannel } from "discord-api-types/v10";
import { Session } from "../session";
import { applyToClass } from "./mixers/applyToClass";
import { TextBaseChannel } from "./extra/TextBaseChannel";
import { BaseChannel } from "./extra/BaseChannel";
import { ConstructorReturnType } from "@biscuitland/common";

class DM extends BaseChannel {
	constructor(session: Session, data: APIDMChannel) {
		super(session, data);
	}

	override fetch(): Promise<DMChannel> {
		return super.fetch();
	}
}

export const DMChannel = applyToClass(TextBaseChannel, DM);
export type DMChannel = ConstructorReturnType<typeof DMChannel>;
