import type { APIRoleTags } from "discord-api-types/v10";

export class RoleTag {
	constructor(data: APIRoleTags) {
		this.botId = data.bot_id;
		this.integrationId = data.integration_id;
		this.premiumSubscriber = !!data.premium_subscriber;
		this.availableForPurchase = !!data.available_for_purchase;
		this.guildConnections = !!data.guild_connections;
	}

	/** the id of the bot this role belongs to */
	botId?: string;

	/** the id of the integration this role belongs to */
	integrationId?: string;

	/** whether this is the guild's Booster role */
	premiumSubscriber: boolean;

	/** the id of this role's subscription sku and listing */
	subscriptionListingId?: string;

	/** whether this role is available for purchase */
	availableForPurchase: boolean;

	/** whether this role is a guild's linked role */
	guildConnections: boolean;
}
