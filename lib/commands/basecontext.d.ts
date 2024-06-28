import type { ModalContext } from '../components';
import type { ContextComponentCommandInteractionMap, ComponentContext } from '../components/componentcontext';
import type { MessageCommandInteraction, UserCommandInteraction } from '../structures';
import type { CommandContext } from './applications/chatcontext';
import type { MenuCommandContext } from './applications/menucontext';
import type { UsingClient } from './applications/shared';
export declare class BaseContext {
    readonly client: UsingClient;
    constructor(client: UsingClient);
    /**
     * Gets the proxy object.
     */
    get proxy(): import("..").APIRoutes;
    isChat(): this is CommandContext;
    isMenu(): this is MenuCommandContext<UserCommandInteraction | MessageCommandInteraction>;
    isMenuUser(): this is MenuCommandContext<UserCommandInteraction>;
    isMenuMessage(): this is MenuCommandContext<MessageCommandInteraction>;
    isComponent(): this is ComponentContext<keyof ContextComponentCommandInteractionMap>;
    isModal(): this is ModalContext;
    isButton(): this is ComponentContext<'Button'>;
    isChannelSelectMenu(): this is ComponentContext<'ChannelSelect'>;
    isRoleSelectMenu(): this is ComponentContext<'RoleSelect'>;
    isMentionableSelectMenu(): this is ComponentContext<'MentionableSelect'>;
    isUserSelectMenu(): this is ComponentContext<'UserSelect'>;
    isStringSelectMenu(): this is ComponentContext<'StringSelect'>;
}
