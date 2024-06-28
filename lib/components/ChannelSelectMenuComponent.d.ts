import type { ComponentType } from 'discord-api-types/v10';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';
export declare class ChannelSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.ChannelSelect> {
    get channelsTypes(): import("discord-api-types/v10").ChannelType[] | undefined;
    get defaultValues(): import("discord-api-types/v10").APISelectMenuDefaultValue<import("discord-api-types/v10").SelectMenuDefaultValueType.Channel>[] | undefined;
}
