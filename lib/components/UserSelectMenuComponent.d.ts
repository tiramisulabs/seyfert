import type { ComponentType } from 'discord-api-types/v10';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';
export declare class UserSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.UserSelect> {
    get defaultValues(): import("discord-api-types/v10").APISelectMenuDefaultValue<import("discord-api-types/v10").SelectMenuDefaultValueType.User>[] | undefined;
}
