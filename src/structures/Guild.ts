import type { GuildMemberStructure, GuildStructure, ThreadChannelStructure } from '../client';
import type { UsingClient } from '../commands';
import type { CreateInviteFromChannel } from '../common';
import type { ObjectToLower, StructPropState, StructStates, ToClass } from '../common/types/util';
import type { APIGuild, APIPartialGuild, GatewayGuildCreateDispatchData, RESTPatchAPIGuildJSONBody } from '../types';
import { AutoModerationRule } from './AutoModerationRule';
import { GuildEmoji } from './Emoji';
import { GuildBan } from './GuildBan';
import { GuildMember } from './GuildMember';
import { GuildRole } from './GuildRole';
import { GuildTemplate } from './GuildTemplate';
import { Sticker } from './Sticker';
import { BaseChannel, WebhookGuildMethods } from './channels';
import { BaseGuild } from './extra/BaseGuild';
import type { DiscordBase } from './extra/DiscordBase';

export interface Guild extends ObjectToLower<Omit<APIGuild, 'stickers' | 'emojis' | 'roles'>>, DiscordBase {}
export class Guild<State extends StructStates = 'api'> extends (BaseGuild as unknown as ToClass<
	Omit<BaseGuild, keyof ObjectToLower<APIPartialGuild>>,
	Guild
>) {
	joinedAt!: StructPropState<number, State, 'create'>;
	memberCount!: StructPropState<number, State, 'create'>;
	large!: StructPropState<boolean, State, 'create'>;
	unavailable?: StructPropState<boolean, State, 'create'>;

	constructor(client: UsingClient, data: APIGuild | GatewayGuildCreateDispatchData) {
		super(client, data);

		if ('joined_at' in data) {
			this.joinedAt = Number(data.joined_at) as never;
			this.memberCount = data.member_count as never;
			this.large = data.large as never;
			this.unavailable = data.unavailable as never;
		}
	}

	webhooks = WebhookGuildMethods.guild({ client: this.client, guildId: this.id });

	get maxStickers(): MaxStickers {
		switch (this.premiumTier) {
			case 1:
				return 15;
			case 2:
				return 30;
			case 3:
				return 60;
			default:
				return 5;
		}
	}

	get maxEmojis(): MaxEmojis {
		switch (this.premiumTier) {
			case 1:
				return 100;
			case 2:
				return 150;
			case 3:
				return 250;
			default:
				return 50;
		}
	}

	async fetchOwner(force = false): Promise<GuildMemberStructure | null> {
		// For no reason, discord has some guilds without owner... 🤓
		if (!this.ownerId) {
			return null;
		}
		return this.members.fetch(this.ownerId, force);
	}

	listActiveThreads(force = false): Promise<ThreadChannelStructure[]> {
		return this.client.threads.listGuildActive(this.id, force);
	}

	templates = GuildTemplate.methods({ client: this.client, guildId: this.id });
	stickers = Sticker.methods({ client: this.client, guildId: this.id });
	members = GuildMember.methods({ client: this.client, guildId: this.id });
	moderationRules = AutoModerationRule.methods({ client: this.client, guildId: this.id });
	roles = GuildRole.methods({ client: this.client, guildId: this.id });
	channels = BaseChannel.allMethods({ client: this.client, guildId: this.id });
	emojis = GuildEmoji.methods({ client: this.client, guildId: this.id });
	bans = GuildBan.methods({ client: this.client, guildId: this.id });

	edit(body: RESTPatchAPIGuildJSONBody, reason?: string): Promise<GuildStructure<'api'>> {
		return this.client.guilds.edit(this.id, body, reason);
	}

	invites = {
		list: () => this.client.invites.guilds.list(this.id),
		create: (data: CreateInviteFromChannel) => this.client.invites.channels.create(data),
		delete: (code: string, reason?: string) => this.client.invites.delete(code, reason),
	};
}

/** Maximun custom guild emojis per level */
export type MaxEmojis = 50 | 100 | 150 | 250;

/** Maximun custom guild stickers per level */
export type MaxStickers = 5 | 15 | 30 | 60;
