import { ErrorCodes } from './ErrorCodes';
import { ErrorMessages } from './ErrorMessages';

export class BiscuitError extends Error {
	error: string;
	constructor(message: ErrorMessages, error: ErrorCodes) {
		super(message);
		this.name = 'BiscuitError';
		this.error = error;
	}

	getError() {
		return {
			error: this.error,
			message: this.message
		};
	}
}
