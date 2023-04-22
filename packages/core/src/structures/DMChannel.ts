import { APIDMChannel } from '@biscuitland/common';
import { Session } from '../session';
import { applyToClass } from './mixers/applyToClass';
import { TextBaseChannel } from './extra/TextBaseChannel';
import { BaseChannel } from './extra/BaseChannel';

// rome-ignore lint/correctness/noUnusedVariables: typing resolve
interface DM extends BaseChannel {
	fetch(): Promise<DMChannel>;
}
class DM extends BaseChannel {
	constructor(session: Session, data: APIDMChannel) {
		super(session, data);
	}
}

export const DMChannel = applyToClass(TextBaseChannel, DM);
export type DMChannel = InstanceType<typeof DMChannel>;
