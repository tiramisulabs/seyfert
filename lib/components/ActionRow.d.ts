import type { APIMessageActionRowComponent, ComponentType } from 'discord-api-types/v10';
import { BaseComponent } from './BaseComponent';
import type { ActionRowMessageComponents } from './index';
export declare class MessageActionRowComponent<T extends ActionRowMessageComponents> extends BaseComponent<ComponentType.ActionRow> {
    private ComponentsFactory;
    constructor(data: {
        type: ComponentType.ActionRow;
        components: APIMessageActionRowComponent[];
    });
    get components(): T[];
}
