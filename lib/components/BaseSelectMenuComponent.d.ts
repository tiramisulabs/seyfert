import type { ComponentType } from 'discord-api-types/v10';
import { BaseComponent } from './BaseComponent';
export type APISelectMenuComponentTypes = ComponentType.ChannelSelect | ComponentType.MentionableSelect | ComponentType.RoleSelect | ComponentType.StringSelect | ComponentType.UserSelect;
export declare class BaseSelectMenuComponent<T extends APISelectMenuComponentTypes> extends BaseComponent<T> {
    get customId(): string;
    get disabed(): boolean | undefined;
    get max(): number | undefined;
    get min(): number | undefined;
    get placeholder(): string | undefined;
}
