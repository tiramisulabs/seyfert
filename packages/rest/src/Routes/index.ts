import { ApplicationRoutes } from './applications';
import { ChannelRoutes } from './channels';
import { GatewayRoutes } from './gateway';
import { GuildRoutes } from './guilds';
import { InteractionRoutes } from './interactions';
import { InviteRoutes } from './invites';
import { StageInstanceRoutes } from './stage-instances';
import { StickerRoutes } from './stickers';
import { UserRoutes } from './users';
import { VoiceRoutes } from './voice';
import { WebhookRoutes } from './webhooks';

export type Routes = ApplicationRoutes &
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
