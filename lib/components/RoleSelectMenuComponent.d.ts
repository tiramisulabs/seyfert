import type { ComponentType } from 'discord-api-types/v10';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';
export declare class RoleSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.RoleSelect> {
    get defaultValues(): import("discord-api-types/v10").APISelectMenuDefaultValue<import("discord-api-types/v10").SelectMenuDefaultValueType.Role>[] | undefined;
}
