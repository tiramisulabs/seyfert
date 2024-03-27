import { ComponentContext, type ComponentCommandInteractionMap } from '../components/componentcontext';
import { Message, User, type MessageCommandInteraction, type UserCommandInteraction } from '../structures';
import { CommandContext } from './applications/chatcontext';
import { MenuCommandContext } from './applications/menucontext';
import type { UsingClient } from './applications/shared';

export class BaseContext {
	constructor(readonly client: UsingClient) {}

	get proxy() {
		return this.client.proxy;
	}

	isChat(): this is CommandContext {
		return this instanceof CommandContext;
	}

	isMenu(): this is MenuCommandContext<any> {
		return this instanceof MenuCommandContext;
	}

	isMenuUser(): this is MenuCommandContext<UserCommandInteraction> {
		return this instanceof MenuCommandContext && this.target instanceof User;
	}

	isMenuMessage(): this is MenuCommandContext<MessageCommandInteraction> {
		return this instanceof MenuCommandContext && this.target instanceof Message;
	}

	isComponent(): this is ComponentContext<keyof ComponentCommandInteractionMap> {
		return this instanceof ComponentContext;
	}
}
