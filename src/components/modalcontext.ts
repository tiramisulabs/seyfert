import type { ModalCommand, ModalSubmitInteraction, ReturnCache } from '..';
import type { GuildMemberStructure, GuildStructure, InteractionGuildMemberStructure } from '../client/transformers';
import type { ExtendContext, RegisteredMiddlewares } from '../commands';
import type { BaseContext } from '../commands/basecontext';
import type { RESTGetAPIGuildQuery } from '../types';
import { InteractionResponseContext } from './interactioncontext';

export interface ModalContext extends BaseContext, ExtendContext {}

export class ModalContext<M extends keyof RegisteredMiddlewares = never> extends InteractionResponseContext<
	ModalSubmitInteraction,
	M
> {
	command!: ModalCommand;

	get components() {
		return this.interaction.components;
	}

	isModal(): this is ModalContext<M> {
		return true;
	}

	inGuild(): this is GuildModalContext<M> {
		return !!this.guildId;
	}
}

export interface GuildModalContext<M extends keyof RegisteredMiddlewares = never> extends ModalContext<M> {
	guildId: string;
	member: InteractionGuildMemberStructure;
	guild(mode?: 'rest' | 'flow', query?: RESTGetAPIGuildQuery): Promise<GuildStructure<'cached' | 'api'>>;
	guild(mode: 'cache', query?: RESTGetAPIGuildQuery): ReturnCache<GuildStructure<'cached'> | undefined>;

	me(mode?: 'rest' | 'flow'): Promise<GuildMemberStructure>;
	me(mode: 'cache'): ReturnCache<GuildMemberStructure | undefined>;
}
