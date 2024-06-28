import type { APIBaseComponent, ComponentType } from 'discord-api-types/v10';
export declare abstract class BaseComponentBuilder<TYPE extends Partial<APIBaseComponent<ComponentType>> = APIBaseComponent<ComponentType>> {
    data: Partial<TYPE>;
    constructor(data: Partial<TYPE>);
    toJSON(): TYPE;
}
export type OptionValuesLength = {
    max: number;
    min: number;
};
