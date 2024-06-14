import type { ModalContext } from '../components';
import type { ContextComponentCommandInteractionMap, ComponentContext } from '../components/componentcontext';
import type { MessageCommandInteraction, UserCommandInteraction } from '../structures';
import type { CommandContext } from './applications/chatcontext';
import type { MenuCommandContext } from './applications/menucontext';
import type { UsingClient } from './applications/shared';

export class BaseContext {
	constructor(readonly client: UsingClient) {}

	/**
	 * Gets the proxy object.
	 */
	get proxy() {
		return this.client.proxy;
	}

	isChat(): this is CommandContext {
		return false;
	}

	isMenu(): this is MenuCommandContext<UserCommandInteraction | MessageCommandInteraction> {
		return false;
	}

	isMenuUser(): this is MenuCommandContext<UserCommandInteraction> {
		return false;
	}

	isMenuMessage(): this is MenuCommandContext<MessageCommandInteraction> {
		return false;
	}

	isComponent(): this is ComponentContext<keyof ContextComponentCommandInteractionMap> {
		return false;
	}

	isModal(): this is ModalContext {
		return false;
	}

	isButton(): this is ComponentContext<'Button'> {
		return false;
	}

	isChannelSelectMenu(): this is ComponentContext<'ChannelSelect'> {
		return false;
	}

	isRoleSelectMenu(): this is ComponentContext<'RoleSelect'> {
		return false;
	}

	isMentionableSelectMenu(): this is ComponentContext<'MentionableSelect'> {
		return false;
	}

	isUserSelectMenu(): this is ComponentContext<'UserSelect'> {
		return false;
	}

	isStringSelectMenu(): this is ComponentContext<'StringSelect'> {
		return false;
	}
}
