import type { ComponentCommandInteractionMap, ComponentContext } from '../components/componentcontext';
import type { MessageCommandInteraction, UserCommandInteraction } from '../structures';
import type { CommandContext } from './applications/chatcontext';
import type { MenuCommandContext } from './applications/menucontext';
import type { UsingClient } from './applications/shared';

export class BaseContext {
	constructor(readonly client: UsingClient) {}

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

	isComponent(): this is ComponentContext<keyof ComponentCommandInteractionMap> {
		return false;
	}
}
