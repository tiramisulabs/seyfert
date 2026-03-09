import type {
	ButtonInteraction,
	ChannelSelectMenuInteraction,
	ComponentCommand,
	MentionableSelectMenuInteraction,
	RoleSelectMenuInteraction,
	StringSelectMenuInteraction,
	UserSelectMenuInteraction,
} from '..';
import type { ReturnCache } from '../cache';
import type { GuildMemberStructure, GuildStructure } from '../client/transformers';
import type { RegisteredMiddlewares } from '../commands';
import type { ComponentInteractionMessageUpdate, MakeRequired } from '../common';
import { ComponentType } from '../types';
import { InteractionResponseContext } from './interactioncontext';

export interface ComponentContext<
	Type extends keyof ContextComponentCommandInteractionMap = keyof ContextComponentCommandInteractionMap,
	M extends keyof RegisteredMiddlewares = never,
> extends InteractionResponseContext<ContextComponentCommandInteractionMap[Type], M> {}

export class ComponentContext<
	Type extends keyof ContextComponentCommandInteractionMap,
	M extends keyof RegisteredMiddlewares = never,
> extends InteractionResponseContext<ContextComponentCommandInteractionMap[Type], M> {
	command!: ComponentCommand;

	deferUpdate() {
		return this.interaction.deferUpdate();
	}

	update(body: ComponentInteractionMessageUpdate) {
		return this.interaction.update(body);
	}

	isComponent(): this is ComponentContext<keyof ContextComponentCommandInteractionMap> {
		return true;
	}

	isButton(): this is ComponentContext<'Button', M> {
		return this.interaction.componentType === ComponentType.Button;
	}

	isChannelSelectMenu(): this is ComponentContext<'ChannelSelect', M> {
		return this.interaction.componentType === ComponentType.ChannelSelect;
	}

	isRoleSelectMenu(): this is ComponentContext<'RoleSelect', M> {
		return this.interaction.componentType === ComponentType.RoleSelect;
	}

	isMentionableSelectMenu(): this is ComponentContext<'MentionableSelect', M> {
		return this.interaction.componentType === ComponentType.MentionableSelect;
	}

	isUserSelectMenu(): this is ComponentContext<'UserSelect', M> {
		return this.interaction.componentType === ComponentType.UserSelect;
	}

	isStringSelectMenu(): this is ComponentContext<'StringSelect', M> {
		return this.interaction.componentType === ComponentType.StringSelect;
	}

	inGuild(): this is GuildComponentContext<Type, M> {
		return !!this.guildId;
	}
}

export interface ContextComponentCommandInteractionMap {
	Button: ButtonInteraction;
	StringSelect: StringSelectMenuInteraction;
	UserSelect: UserSelectMenuInteraction;
	RoleSelect: RoleSelectMenuInteraction;
	MentionableSelect: MentionableSelectMenuInteraction;
	ChannelSelect: ChannelSelectMenuInteraction;
}

export interface GuildComponentContext<
	Type extends keyof ContextComponentCommandInteractionMap,
	M extends keyof RegisteredMiddlewares = never,
> extends Omit<MakeRequired<ComponentContext<Type, M>, 'guildId' | 'member'>, 'guild' | 'me'> {
	guild(mode?: 'rest' | 'flow'): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache'): ReturnCache<GuildStructure<'cached'> | undefined>;

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
	me(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
}
