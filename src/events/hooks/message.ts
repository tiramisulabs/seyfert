import type {
	APIMessage,
	GatewayMessageCreateDispatchData,
	GatewayMessageDeleteBulkDispatchData,
	GatewayMessageDeleteDispatchData,
	GatewayMessagePollVoteDispatchData,
	GatewayMessageReactionAddDispatchData,
	GatewayMessageReactionRemoveAllDispatchData,
	GatewayMessageReactionRemoveDispatchData,
	GatewayMessageReactionRemoveEmojiDispatchData,
	GatewayMessageUpdateDispatchData,
} from 'discord-api-types/v10';
import type { BaseClient } from '../../client/base';
import { type MakeRequired, type PartialClass, toCamelCase } from '../../common';
import { Message } from '../../structures';

export const MESSAGE_CREATE = (self: BaseClient, data: GatewayMessageCreateDispatchData) => {
	return new Message(self, data);
};

export const MESSAGE_DELETE = async (self: BaseClient, data: GatewayMessageDeleteDispatchData) => {
	return (await self.cache.messages?.get(data.id)) ?? toCamelCase(data);
};

export const MESSAGE_DELETE_BULK = async (self: BaseClient, data: GatewayMessageDeleteBulkDispatchData) => {
	return {
		...data,
		messages: await Promise.all(data.ids.map(id => self.cache.messages?.get(id))),
	};
};

export const MESSAGE_REACTION_ADD = (_self: BaseClient, data: GatewayMessageReactionAddDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE = (_self: BaseClient, data: GatewayMessageReactionRemoveDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE_ALL = (_self: BaseClient, data: GatewayMessageReactionRemoveAllDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_REACTION_REMOVE_EMOJI = (
	_self: BaseClient,
	data: GatewayMessageReactionRemoveEmojiDispatchData,
) => {
	return toCamelCase(data);
};

export const MESSAGE_UPDATE = async (
	self: BaseClient,
	data: GatewayMessageUpdateDispatchData,
): Promise<
	[
		message: MakeRequired<
			PartialClass<Message>,
			'id' | 'channelId' | 'createdAt' | 'createdTimestamp' | 'rest' | 'cache' | 'api' | 'client'
		>,
		old: undefined | Message,
	]
> => {
	return [new Message(self, data as APIMessage), await self.cache.messages?.get(data.id)];
};

export const MESSAGE_POLL_VOTE_ADD = (_: BaseClient, data: GatewayMessagePollVoteDispatchData) => {
	return toCamelCase(data);
};

export const MESSAGE_POLL_VOTE_REMOVE = (_: BaseClient, data: GatewayMessagePollVoteDispatchData) => {
	return toCamelCase(data);
};
