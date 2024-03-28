import { ApplicationCommandType, InteractionType } from 'discord-api-types/v10';
import type { ComponentContext, ComponentCommandInteractionMap } from '../components/componentcontext';
import {
	type ChatInputCommandInteraction,
	type ComponentInteraction,
	Message,
	User,
	type MessageCommandInteraction,
	type UserCommandInteraction,
} from '../structures';
import type { CommandContext } from './applications/chatcontext';
import type { MenuCommandContext } from './applications/menucontext';
import type { UsingClient } from './applications/shared';

export class BaseContext {
	constructor(readonly client: UsingClient) {}

	get proxy() {
		return this.client.proxy;
	}

	isChat(): this is CommandContext {
		//@ts-expect-error
		return this.message || (this.interaction as ChatInputCommandInteraction).type === ApplicationCommandType.ChatInput;
	}

	isMenu(): this is MenuCommandContext<any> {
		return this.isMenuUser() || this.isMenuMessage();
	}

	isMenuUser(): this is MenuCommandContext<UserCommandInteraction> {
		//@ts-expect-error
		return this.target instanceof User;
	}

	isMenuMessage(): this is MenuCommandContext<MessageCommandInteraction> {
		//@ts-expect-error
		return this.target instanceof Message;
	}

	isComponent(): this is ComponentContext<keyof ComponentCommandInteractionMap> {
		//@ts-expect-error
		return (this.interaction as ComponentInteraction).type === InteractionType.MessageComponent;
	}
}
