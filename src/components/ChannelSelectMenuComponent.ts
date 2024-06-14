import type { ComponentType } from 'discord-api-types/v10';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';

export class ChannelSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.ChannelSelect> {
	get channelsTypes() {
		return this.data.channel_types;
	}

	get defaultValues() {
		return this.data.default_values;
	}
}
