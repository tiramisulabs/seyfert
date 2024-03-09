import type { ActionRow, BuilderComponents, ListenerOptions } from '../builders';
import type { RestOrArray } from '../common';

export class ComponentsListener<T extends BuilderComponents> {
	components: ActionRow<T>[] = [];
	idle?: NodeJS.Timeout;
	timeout?: NodeJS.Timeout;

	constructor(readonly options: ListenerOptions = {}) {}

	addRows(...row: RestOrArray<ActionRow<T>>) {
		this.components = this.components.concat(row.flat());
		return this;
	}
}
