import { type APIActionRowComponent, type APIActionRowComponentTypes, type APIButtonComponent, type APIChannelSelectComponent, type APIMentionableSelectComponent, type APIRoleSelectComponent, type APIStringSelectComponent, type APITextInputComponent, type APIUserSelectComponent, ComponentType } from 'discord-api-types/v10';
export declare class BaseComponent<T extends ComponentType> {
    data: APIComponentsMap[T];
    constructor(data: APIComponentsMap[T]);
    get type(): ComponentType;
    toJSON(): APIComponentsMap[T];
    toBuilder(): import("../builders").BuilderComponents | import("../builders").ActionRow<import("../builders").BuilderComponents>;
}
export interface APIComponentsMap {
    [ComponentType.ActionRow]: APIActionRowComponent<APIActionRowComponentTypes>;
    [ComponentType.Button]: APIButtonComponent;
    [ComponentType.ChannelSelect]: APIChannelSelectComponent;
    [ComponentType.MentionableSelect]: APIMentionableSelectComponent;
    [ComponentType.RoleSelect]: APIRoleSelectComponent;
    [ComponentType.StringSelect]: APIStringSelectComponent;
    [ComponentType.UserSelect]: APIUserSelectComponent;
    [ComponentType.TextInput]: APITextInputComponent;
}
