import { APIChannelSelectComponent, ChannelType, ComponentType } from '@biscuitland/common';
import { BaseSelectMenuComponent } from '../extra/BaseSelectMenuComponent';

export class ChannelSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.ChannelSelect> {
	constructor(data: APIChannelSelectComponent) {
		super(data);

		this.channelTypes = data.channel_types;
	}
	channelTypes?: ChannelType[];
}
