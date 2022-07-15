import type { Model } from "../Base.ts";
import type { Snowflake } from "../../Snowflake.ts";
import type { Session } from "../../Session.ts";
import type {
    ApplicationCommandTypes,
    DiscordInteraction,
    DiscordMemberWithUser,
    InteractionTypes,
} from "../../../discordeno/mod.ts";
import BaseInteraction from "./BaseInteraction.ts";
import CommandInteractionOptionResolver from "./CommandInteractionOptionResolver.ts";
import Attachment from "../Attachment.ts";
import User from "../User.ts";
import Member from "../Member.ts";
import Message from "../Message.ts";
import Role from "../Role.ts";

export class CommandInteraction extends BaseInteraction implements Model {
    constructor(session: Session, data: DiscordInteraction) {
        super(session, data);
        this.type = data.type as number;
        this.commandId = data.data!.id;
        this.commandName = data.data!.name;
        this.commandType = data.data!.type;
        this.commandGuildId = data.data!.guild_id;
        this.options = new CommandInteractionOptionResolver(data.data!.options ?? []);

        this.resolved = {
            users: new Map(),
            members: new Map(),
            roles: new Map(),
            attachments: new Map(),
            messages: new Map(),
        };

        if (data.data!.resolved?.users) {
            for (const [id, u] of Object.entries(data.data!.resolved.users)) {
                this.resolved.users.set(id, new User(session, u));
            }
        }

        if (data.data!.resolved?.members && !!super.guildId) {
            for (const [id, m] of Object.entries(data.data!.resolved.members)) {
                this.resolved.members.set(id, new Member(session, m as DiscordMemberWithUser, super.guildId!));
            }
        }

        if (data.data!.resolved?.roles && !!super.guildId) {
            for (const [id, r] of Object.entries(data.data!.resolved.roles)) {
                this.resolved.roles.set(id, new Role(session, r, super.guildId!));
            }
        }

        if (data.data!.resolved?.attachments) {
            for (const [id, a] of Object.entries(data.data!.resolved.attachments)) {
                this.resolved.attachments.set(id, new Attachment(session, a));
            }
        }

        if (data.data!.resolved?.messages) {
            for (const [id, m] of Object.entries(data.data!.resolved.messages)) {
                this.resolved.messages.set(id, new Message(session, m));
            }
        }
    }

    override type: InteractionTypes.ApplicationCommand;
    commandId: Snowflake;
    commandName: string;
    commandType: ApplicationCommandTypes;
    commandGuildId?: Snowflake;
    resolved: {
        users: Map<Snowflake, User>;
        members: Map<Snowflake, Member>;
        roles: Map<Snowflake, Role>;
        attachments: Map<Snowflake, Attachment>;
        messages: Map<Snowflake, Message>;
    };
    options: CommandInteractionOptionResolver;
}

export default CommandInteraction;
