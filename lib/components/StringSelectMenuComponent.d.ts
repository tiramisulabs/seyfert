import type { ComponentType } from 'discord-api-types/v10';
import { BaseSelectMenuComponent } from './BaseSelectMenuComponent';
export declare class StringSelectMenuComponent extends BaseSelectMenuComponent<ComponentType.StringSelect> {
    get options(): import("discord-api-types/v10").APISelectMenuOption[];
}
