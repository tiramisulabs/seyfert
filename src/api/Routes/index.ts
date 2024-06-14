import type { ApplicationRoutes } from './applications';
import type { ChannelRoutes } from './channels';
import type { GatewayRoutes } from './gateway';
import type { GuildRoutes } from './guilds';
import type { InteractionRoutes } from './interactions';
import type { InviteRoutes } from './invites';
import type { StageInstanceRoutes } from './stage-instances';
import type { StickerRoutes } from './stickers';
import type { UserRoutes } from './users';
import type { VoiceRoutes } from './voice';
import type { WebhookRoutes } from './webhooks';

export * from './cdn';

export type APIRoutes = ApplicationRoutes &
	ChannelRoutes &
	GatewayRoutes &
	GuildRoutes &
	InteractionRoutes &
	InviteRoutes &
	StageInstanceRoutes &
	StickerRoutes &
	UserRoutes &
	VoiceRoutes &
	WebhookRoutes;
