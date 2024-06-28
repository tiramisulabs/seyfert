import type { APIButtonComponentWithCustomId, APIButtonComponentWithSKUId, APIButtonComponentWithURL, ButtonStyle, ComponentType } from 'discord-api-types/v10';
import { Button } from '../builders';
import { BaseComponent } from './BaseComponent';
export declare class LinkButtonComponent extends BaseComponent<ComponentType.Button> {
    data: APIButtonComponentWithURL;
    get style(): ButtonStyle.Link;
    get url(): string;
    get label(): string | undefined;
    get disabled(): boolean | undefined;
    get emoji(): import("discord-api-types/v10").APIMessageComponentEmoji | undefined;
    toBuilder(): Button;
}
export type ButtonStyleExludeLink = Exclude<ButtonStyle, ButtonStyle.Link>;
export declare class ButtonComponent extends BaseComponent<ComponentType.Button> {
    data: APIButtonComponentWithCustomId;
    get style(): ButtonStyle.Primary | ButtonStyle.Secondary | ButtonStyle.Success | ButtonStyle.Danger;
    get customId(): string;
    get label(): string | undefined;
    get disabled(): boolean | undefined;
    get emoji(): import("discord-api-types/v10").APIMessageComponentEmoji | undefined;
    toBuilder(): Button;
}
export declare class SKUButtonComponent extends BaseComponent<ComponentType.Button> {
    data: APIButtonComponentWithSKUId;
    get style(): ButtonStyle.Premium;
    get skuId(): string;
    get disabled(): boolean | undefined;
    toBuilder(): Button;
}
