import type { ComponentType } from 'discord-api-types/v10';
import { BaseComponent } from './BaseComponent';
export declare class TextInputComponent extends BaseComponent<ComponentType.TextInput> {
    get customId(): string;
    get value(): string | undefined;
    get style(): import("discord-api-types/v10").TextInputStyle;
    get label(): string;
    get max(): number | undefined;
    get min(): number | undefined;
    get required(): boolean | undefined;
    get placeholder(): string | undefined;
}
