import type { APIChannelSelectComponent, ChannelType, ComponentType } from '../common';
import { BaseSelectMenuComponent } from '../structures/extra/BaseSelectMenuComponent';

export class ChannelSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.ChannelSelect> {
	constructor(data: APIChannelSelectComponent) {
		super(data);

		this.channelTypes = data.channel_types;
	}

	channelTypes?: ChannelType[];
}
