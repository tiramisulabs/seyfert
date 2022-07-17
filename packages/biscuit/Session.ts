import type {
    ApplicationCommandPermissionTypes,
    AtLeastOne,
    DiscordApplicationCommand,
    DiscordApplicationCommandOption,
    DiscordGetGatewayBot,
    DiscordGuildApplicationCommandPermissions,
    DiscordUser,
    GatewayBot,
    GatewayIntents,
    Localization,
} from "../discordeno/mod.ts";

import type { DiscordGatewayPayload, Shard } from "../discordeno/mod.ts";
import type { Events } from "./Actions.ts";
import type { PermissionResolvable } from "./structures/Permissions.ts";
import type { Activities, StatusTypes } from "./structures/Presence.ts";

import { Permissions } from "./structures/Permissions.ts";
import { Snowflake } from "./Snowflake.ts";
import { EventEmitter } from "./util/EventEmmiter.ts";
import {
    ApplicationCommandTypes,
    createGatewayManager,
    createRestManager,
    GatewayOpcodes,
    getBotIdFromToken,
} from "../discordeno/mod.ts";

import User from "./structures/User.ts";
import { urlToBase64 } from "./util/urlToBase64.ts";

import * as Routes from "./Routes.ts";
import * as Actions from "./Actions.ts";

export type DiscordRawEventHandler = (shard: Shard, data: DiscordGatewayPayload) => unknown;

// INTERACTIONS

/**
 * @link https://discord.com/developers/docs/interactions/application-commands#endpoints-json-params
 */
export interface CreateApplicationCommand {
    name: string;
    nameLocalizations?: Localization;
    description: string;
    descriptionLocalizations?: Localization;
    type?: ApplicationCommandTypes;
    options?: DiscordApplicationCommandOption[];
    defaultMemberPermissions?: PermissionResolvable;
    dmPermission?: boolean;
}

/**
 * @link https://discord.com/developers/docs/interactions/application-commands#endpoints-json-params
 */
export interface CreateContextApplicationCommand extends Omit<CreateApplicationCommand, "options"> {
    type: ApplicationCommandTypes.Message | ApplicationCommandTypes.User;
}

/**
 * @link https://discord.com/developers/docs/interactions/application-commands#endpoints-query-string-params
 */
export interface GetApplicationCommand {
    guildId?: Snowflake;
    withLocalizations?: boolean;
}

export interface UpsertApplicationCommands extends CreateApplicationCommand {
    id?: Snowflake;
}

/**
 * @link https://discord.com/developers/docs/interactions/application-commands#edit-application-command-permissions
 */
export interface ApplicationCommandPermissions {
    id: Snowflake;
    type: ApplicationCommandPermissionTypes;
    permission: boolean;
}

/**
 * @link https://discord.com/developers/docs/interactions/application-commands#edit-application-command-permissions
 */
export interface ApplicationCommandPermissions {
    id: Snowflake;
    type: ApplicationCommandPermissionTypes;
    permission: boolean;
}

// END INTERACTIONS

export interface RestOptions {
    secretKey?: string;
    applicationId?: Snowflake;
}

export interface GatewayOptions {
    botId?: Snowflake;
    data?: GatewayBot;
}

export interface SessionOptions {
    token: string;
    rawHandler?: DiscordRawEventHandler;
    intents?: GatewayIntents;
    rest?: RestOptions;
    gateway?: GatewayOptions;
}

/**
 * @link https://discord.com/developers/docs/topics/gateway#update-status
 */
export interface StatusUpdate {
    activities: Activities[];
    status: StatusTypes;
}

/**
 * Receives a Token, connects
 * Most of the command implementations were adapted from Discordeno (https://github.com/discordeno/discordeno)
 */
export class Session extends EventEmitter {
    options: SessionOptions;

    rest: ReturnType<typeof createRestManager>;
    gateway: ReturnType<typeof createGatewayManager>;

    #botId: Snowflake;
    #applicationId?: Snowflake;

    set applicationId(id: Snowflake) {
        this.#applicationId = id;
    }

    get applicationId() {
        return this.#applicationId!;
    }

    set botId(id: Snowflake) {
        this.#botId = id;
    }

    get botId() {
        return this.#botId;
    }

    constructor(options: SessionOptions) {
        super();
        this.options = options;

        const defHandler: DiscordRawEventHandler = (shard, data) => {
            Actions.raw(this, shard.id, data);

            if (!data.t || !data.d) {
                return;
            }

            // deno-lint-ignore no-explicit-any
            Actions[data.t as keyof typeof Actions]?.(this, shard.id, data.d as any);
        };

        this.rest = createRestManager({
            token: this.options.token,
            debug: (text) => {
                // TODO: set this using the event emitter
                super.rawListeners("debug")?.forEach((fn) => fn(text));
            },
            secretKey: this.options.rest?.secretKey ?? undefined,
        });

        this.gateway = createGatewayManager({
            gatewayBot: this.options.gateway?.data ?? {} as GatewayBot, // TODO
            gatewayConfig: {
                token: this.options.token,
                intents: this.options.intents,
            },
            handleDiscordPayload: this.options.rawHandler ?? defHandler,
        });

        this.#botId = getBotIdFromToken(options.token).toString();
    }

    override on<K extends keyof Events>(event: K, func: Events[K]): this;
    override on<K extends string>(event: K, func: (...args: unknown[]) => unknown): this {
        return super.on(event, func);
    }

    override off<K extends keyof Events>(event: K, func: Events[K]): this;
    override off<K extends string>(event: K, func: (...args: unknown[]) => unknown): this {
        return super.off(event, func);
    }

    override once<K extends keyof Events>(event: K, func: Events[K]): this;
    override once<K extends string>(event: K, func: (...args: unknown[]) => unknown): this {
        return super.once(event, func);
    }

    override emit<K extends keyof Events>(event: K, ...params: Parameters<Events[K]>): boolean;
    override emit<K extends string>(event: K, ...params: unknown[]): boolean {
        return super.emit(event, ...params);
    }

    async editProfile(nick?: string, avatarURL?: string | null ): Promise<User> {
        const avatar = avatarURL ? await urlToBase64(avatarURL) : avatarURL;
        const user = await this.rest.runMethod<DiscordUser>(this.rest, 'PATCH', Routes.USER(), {
            username: nick,
            avatar: avatar
        });
        return new User(this, user);
    }

    /**
     * Edit bot's status
     * tip: execute this on the ready event if possible
     * @example
     * for (const { id } of session.gateway.manager.shards) {
     *    session.editStatus(id, data);
     * }
     */
    editStatus(shardId: number, status: StatusUpdate): void {
        const shard = this.gateway.manager.shards.get(shardId);

        if (!shard) {
            throw new Error(`Unknown shard ${shardId}`);
        }

        shard.send({
            op: GatewayOpcodes.PresenceUpdate,
            d: {
                status: status.status,
                since: null,
                afk: false,
                activities: status.activities.map((activity) => {
                    return {
                        name: activity.name,
                        type: activity.type,
                        url: activity.url,
                        created_at: activity.createdAt,
                        timestamps: activity.timestamps,
                        application_id: this.applicationId,
                        details: activity.details,
                        state: activity.state,
                        emoji: activity.emoji || {
                            name: activity.emoji!.name,
                            id: activity.emoji!.id,
                            animated: activity.emoji!.animated,
                        },
                        party: activity.party,
                        assets: activity.assets
                            ? {
                                large_image: activity.assets.largeImage,
                                large_text: activity.assets.largeText,
                                small_image: activity.assets.smallImage,
                                small_text: activity.assets.smallText,
                            }
                            : undefined,
                        secrets: activity.secrets,
                        instance: activity.instance,
                        flags: activity.flags,
                        buttons: activity.buttons,
                    };
                }),
            },
        });
    }

    async fetchUser(id: Snowflake): Promise<User | undefined> {
        const user: DiscordUser = await this.rest.runMethod<DiscordUser>(this.rest, "GET", Routes.USER(id));

        if (!user.id) return;

        return new User(this, user);
    }

    createApplicationCommand(options: CreateApplicationCommand | CreateContextApplicationCommand, guildId?: Snowflake): Promise<DiscordApplicationCommand> {
        return this.rest.runMethod<DiscordApplicationCommand>(
            this.rest,
            "POST",
            guildId
                ? Routes.GUILD_APPLICATION_COMMANDS(this.applicationId, guildId)
                : Routes.APPLICATION_COMMANDS(this.applicationId),
            this.isContextApplicationCommand(options)
                ? {
                    name: options.name,
                    name_localizations: options.nameLocalizations,
                    type: options.type,
                }
                : {
                    name: options.name,
                    name_localizations: options.nameLocalizations,
                    description: options.description,
                    description_localizations: options.descriptionLocalizations,
                    type: options.type,
                    options: options.options,
                    default_member_permissions: options.defaultMemberPermissions
                        ? new Permissions(options.defaultMemberPermissions).bitfield.toString()
                        : undefined,
                    dm_permission: options.dmPermission,
                },
        );
    }

    deleteApplicationCommand(id: Snowflake, guildId?: Snowflake): Promise<undefined> {
        return this.rest.runMethod<undefined>(
            this.rest,
            "DELETE",
            guildId
                ? Routes.GUILD_APPLICATION_COMMANDS(this.applicationId, guildId, id)
                : Routes.APPLICATION_COMMANDS(this.applicationId, id),
        );
    }

    updateApplicationCommandPermissions(
        guildId: Snowflake,
        id: Snowflake,
        bearerToken: string,
        options: ApplicationCommandPermissions[],
    ): Promise<DiscordGuildApplicationCommandPermissions> {
        return this.rest.runMethod<DiscordGuildApplicationCommandPermissions>(
            this.rest,
            "PUT",
            Routes.GUILD_APPLICATION_COMMANDS_PERMISSIONS(this.applicationId, guildId, id),
            {
                permissions: options,
            },
            {
                headers: { authorization: `Bearer ${bearerToken}` },
            },
        );
    }

    fetchApplicationCommand(id: Snowflake, options?: GetApplicationCommand): Promise<DiscordApplicationCommand> {
        return this.rest.runMethod<DiscordApplicationCommand>(
            this.rest,
            "GET",
            options?.guildId
                ? Routes.GUILD_APPLICATION_COMMANDS_LOCALIZATIONS(
                    this.applicationId,
                    options.guildId,
                    id,
                    options?.withLocalizations,
                )
                : Routes.APPLICATION_COMMANDS(this.applicationId, id),
        );
    }

    fetchApplicationCommandPermissions(guildId: Snowflake): Promise<DiscordGuildApplicationCommandPermissions[]> {
        return this.rest.runMethod<DiscordGuildApplicationCommandPermissions[]>(
            this.rest,
            "GET",
            Routes.GUILD_APPLICATION_COMMANDS_PERMISSIONS(this.applicationId, guildId),
        );
    }

    fetchApplicationCommandPermission(guildId: Snowflake, id: Snowflake): Promise<DiscordGuildApplicationCommandPermissions> {
        return this.rest.runMethod<DiscordGuildApplicationCommandPermissions>(
            this.rest,
            "GET",
            Routes.GUILD_APPLICATION_COMMANDS_PERMISSIONS(this.applicationId, guildId, id),
        );
    }

    upsertApplicationCommand(
        id: Snowflake,
        options: AtLeastOne<CreateApplicationCommand> | AtLeastOne<CreateContextApplicationCommand>,
        guildId?: Snowflake,
    ): Promise<DiscordApplicationCommand> {
        return this.rest.runMethod<DiscordApplicationCommand>(
            this.rest,
            "PATCH",
            guildId
                ? Routes.GUILD_APPLICATION_COMMANDS(this.applicationId, guildId)
                : Routes.APPLICATION_COMMANDS(this.applicationId, id),
            this.isContextApplicationCommand(options)
                ? {
                    name: options.name,
                    type: options.type,
                }
                : {
                    name: options.name,
                    description: options.description,
                    type: options.type,
                    options: options.options,
                },
        );
    }

    upsertApplicationCommands(
        options: Array<UpsertApplicationCommands | CreateContextApplicationCommand>,
        guildId?: Snowflake,
    ): Promise<DiscordApplicationCommand[]> {
        return this.rest.runMethod<DiscordApplicationCommand[]>(
            this.rest,
            "PUT",
            guildId
                ? Routes.GUILD_APPLICATION_COMMANDS(this.applicationId, guildId)
                : Routes.APPLICATION_COMMANDS(this.applicationId),
            options.map((o) =>
                this.isContextApplicationCommand(o)
                    ? {
                        name: o.name,
                        type: o.type,
                    }
                    : {
                        name: o.name,
                        description: o.description,
                        type: o.type,
                        options: o.options,
                    }
            ),
        );
    }

    fetchCommands(guildId?: Snowflake): Promise<DiscordApplicationCommand[]> {
        return this.rest.runMethod<DiscordApplicationCommand[]>(
            this.rest,
            "GET",
            guildId
                ? Routes.GUILD_APPLICATION_COMMANDS(this.applicationId, guildId)
                : Routes.APPLICATION_COMMANDS(this.applicationId),
        );
    }

    // deno-fmt-ignore
    isContextApplicationCommand(cmd: AtLeastOne<CreateContextApplicationCommand> | AtLeastOne<CreateApplicationCommand>): cmd is AtLeastOne<CreateContextApplicationCommand> {
        return cmd.type === ApplicationCommandTypes.Message || cmd.type === ApplicationCommandTypes.User;
    }

    async start(): Promise<void> {
        const getGatewayBot = () => this.rest.runMethod<DiscordGetGatewayBot>(this.rest, "GET", Routes.GATEWAY_BOT());

        // check if is empty
        if (!Object.keys(this.options.gateway?.data ?? {}).length) {
            const nonParsed = await getGatewayBot();

            this.gateway.gatewayBot = {
                url: nonParsed.url,
                shards: nonParsed.shards,
                sessionStartLimit: {
                    total: nonParsed.session_start_limit.total,
                    remaining: nonParsed.session_start_limit.remaining,
                    resetAfter: nonParsed.session_start_limit.reset_after,
                    maxConcurrency: nonParsed.session_start_limit.max_concurrency,
                },
            };
            this.gateway.lastShardId = this.gateway.gatewayBot.shards - 1;
            this.gateway.manager.totalShards = this.gateway.gatewayBot.shards;
        }

        this.gateway.spawnShards();
    }
}
