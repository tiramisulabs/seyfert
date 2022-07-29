import { EventAdapter } from '@biscuitland/core';

export class ReadyEvent {
	events: EventAdapter;

	constructor(events: EventAdapter) {
		this.events = events;

		if (events) {
			this.execute();
		}
	}

	async execute() {
		this.events.on('ready', () => console.log('[1/1] successful'));
	}
}
