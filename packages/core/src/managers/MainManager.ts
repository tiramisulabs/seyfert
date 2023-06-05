import type { Session } from '../session';
import { ApplicationManager } from './ApplicationManager';
import { ChannelManager } from './ChannelManager';
import { GuildManager } from './GuildManager';
import { InteractionManager } from './InteractionManager';
import { MemberManager } from './MemberManager';
import { UserManager } from './UserManager';
import { WebhookManager } from './WebhookManager';

export class MainManager {
  constructor(private readonly session: Session) {
    this.users = new UserManager(this.session);
    this.guilds = new GuildManager(this.session);
    this.members = new MemberManager(this.session);
    this.channels = new ChannelManager(this.session);
    this.application = new ApplicationManager(this.session);
    this.interaction = new InteractionManager(this.session);
    this.webhook = new WebhookManager(this.session);
  }

  users: UserManager;
  guilds: GuildManager;
  members: MemberManager;
  channels: ChannelManager;
  application: ApplicationManager;
  interaction: InteractionManager;
  webhook: WebhookManager;
}
