import { ComponentType, APIMessageActionRowComponent } from '@biscuitland/common';
import { Session } from '../../session';
import { BiscuitActionRowMessageComponents } from '../../utils/types';

import { BaseComponent } from '../extra/BaseComponent';
import { componentFactory } from '../../utils/utils';

export class MessageActionRowComponent<
	T extends BiscuitActionRowMessageComponents,
> extends BaseComponent<ComponentType.ActionRow> {
	constructor(
		readonly session: Session,
		data: {
			type: ComponentType.ActionRow;
			components: APIMessageActionRowComponent[];
		}
	) {
		super(data);
		this.components = data.components.map((component) => componentFactory(component)) as T[];
	}
	components: T[];
}
