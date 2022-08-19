import type {
    AtLeastOne,
    ApplicationCommandPermissionTypes,
    DiscordApplicationCommand,
	// DiscordGatewayPayload,
    DiscordGuildApplicationCommandPermissions,
    DiscordUser,
    DiscordApplicationCommandOption,
	GatewayIntents,
    Localization,
	Snowflake,
    DiscordGetGatewayBot,
} from '@biscuitland/api-types';

import { ApplicationCommandTypes, GatewayOpcodes } from '@biscuitland/api-types';

// routes

import {
    APPLICATION_COMMANDS,
    GUILD_APPLICATION_COMMANDS,
    GUILD_APPLICATION_COMMANDS_PERMISSIONS,
    GUILD_APPLICATION_COMMANDS_LOCALIZATIONS,
    USER
} from '@biscuitland/api-types';

import type { PermissionResolvable } from './structures/special/permissions';
import type { Activities, StatusTypes } from './structures/presence';

// structs

import { User } from './structures/user';

// DiscordGetGatewayBot;

import type { RestAdapter } from '@biscuitland/rest';
import { DefaultRestAdapter } from '@biscuitland/rest';

import type { WsAdapter } from '@biscuitland/ws';
import { DefaultWsAdapter } from '@biscuitland/ws';

import type { EventAdapter } from './adapters/event-adapter';
import { DefaultEventAdapter } from './adapters/default-event-adapter';

import { Util } from './utils/util';
import { Shard } from '@biscuitland/ws';

// PRESENCE

/**
 * @link https://discord.com/developers/docs/topics/gateway#update-status
 */
export interface StatusUpdate {
    activities: Activities[];
    status: keyof typeof StatusTypes;
}

// END PRESENCE

// INTERACTIONS

export type CreateApplicationCommands = CreateApplicationCommand | CreateContextApplicationCommand;
export type UpsertDataApplicationCommands =
    | AtLeastOne<CreateApplicationCommand>
    | AtLeastOne<CreateContextApplicationCommand>;
export type LastCreateApplicationCommands =
    | AtLeastOne<CreateContextApplicationCommand>
    | AtLeastOne<CreateApplicationCommand>;

/**
 * @link https://discord.com/developers/docs/interactions/application-commands#endpoints-json-params
 */
export interface CreateApplicationCommand {
    name: string;
    name_localizations?: Localization;
    description: string;
    description_localizations?: Localization;
    type?: ApplicationCommandTypes;
    options?: DiscordApplicationCommandOption[];
    default_member_permissions?: PermissionResolvable;
    dm_permission?: boolean;
}

/**
 * @link https://discord.com/developers/docs/interactions/application-commands#endpoints-json-params
 */
export interface CreateContextApplicationCommand extends Omit<CreateApplicationCommand, 'options'> {
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

export type DiscordRawEventHandler = (
	shard: Shard,
	data: MessageEvent<any>
) => unknown;

export type PickOptions = Pick<
	BiscuitOptions,
	Exclude<keyof BiscuitOptions, keyof typeof Session.DEFAULTS>
> &
	Partial<BiscuitOptions>;

export interface BiscuitOptions {
	intents?: GatewayIntents;
	token: string;

	events?: {
		adapter?: { new (...args: any[]): EventAdapter };
		options: any;
	};

	rest: {
		adapter?: { new (...args: any[]): RestAdapter };
		options: any;
	};

	ws: {
		adapter?: { new (...args: any[]): WsAdapter };
		options: any;
	};
}

import * as Actions from './adapters/events';

export class Session {
	private _applicationId?: Snowflake;
	private _botId?: Snowflake;
	token: string;

	set botId(snowflake: Snowflake) {
		this._botId = snowflake;
	}

	get botId(): Snowflake {
		return this._botId ?? Util.getBotIdFromToken(this.token);
	}

	set applicationId(snowflake: Snowflake) {
		this._applicationId = snowflake;
	}

	get applicationId(): Snowflake {
		return this._applicationId ?? this.botId;
	}

	static readonly DEFAULTS = {
		rest: {
			adapter: DefaultRestAdapter,
			options: null,
		},
		ws: {
			adapter: DefaultWsAdapter,
			options: null,
		},
	};

	options: BiscuitOptions;

	readonly events: EventAdapter;

	readonly rest: RestAdapter;
	readonly ws: WsAdapter;

	private adapters = new Map<string, any>();

	constructor(options: PickOptions) {
		this.options = Object.assign(options, Session.DEFAULTS);

		// makeRest

		if (!this.options.rest.options) {
			this.options.rest.options = {
				intents: this.options.intents,
				token: this.options.token,
			};
		}

		this.rest = this.getRest();

		// makeWs

		const defHandler: DiscordRawEventHandler = (shard, event) => {
            let data = event as any;
			// let data = JSON.parse(message) as DiscordGatewayPayload;

			Actions.raw(this, shard.id, data);

			if (!data.t || !data.d) {
				return;
			}

			Actions[data.t as keyof typeof Actions]?.(
				this,
				shard.id,
				data.d as any
			);
		};

		if (!this.options.ws.options) {
			this.options.ws.options = {
				handleDiscordPayload: defHandler,

				gatewayConfig: {
					token: this.options.token,
					intents: this.options.intents,
				},

				intents: this.options.intents,
				token: this.options.token,
			};
		}

		// makeEvents

		this.events = this.options.events?.adapter
			? new this.options.events.adapter()
			: new DefaultEventAdapter();

		this.ws = this.getWs();
		this.token = options.token;
	}

	/**
	 * @inheritDoc
	 */

	private getAdapter<T extends { new (...args: any[]): InstanceType<T> }>(
		adapter: T,
		...args: ConstructorParameters<T>
	): InstanceType<T> {
		if (!this.adapters.has(adapter.name)) {
			const Class = adapter as { new (...args: any[]): T };
			this.adapters.set(adapter.name, new Class(...args));
		}

		return this.adapters.get(adapter.name);
	}

	/**
	 * @inheritDoc
	 */

	private getRest(): RestAdapter {
		return this.getAdapter(
			this.options.rest.adapter!,
			this.options.rest.options
		);
	}

	/**
	 * @inheritDoc
	 */

	private getWs(): WsAdapter {
		return this.getAdapter(
			this.options.ws.adapter!,
			this.options.ws.options
		);
	}

	/**
	 * @inheritDoc
	 */

	async start(): Promise<void> {
		const nonParsed = await this.rest.get<DiscordGetGatewayBot>('/gateway/bot');

		this.ws.options.gatewayBot = {
			url: nonParsed.url,
			shards: nonParsed.shards,
			sessionStartLimit: {
				total: nonParsed.session_start_limit.total,
				remaining: nonParsed.session_start_limit.remaining,
				resetAfter: nonParsed.session_start_limit.reset_after,
				maxConcurrency: nonParsed.session_start_limit.max_concurrency,
			},
		};

		this.ws.options.lastShardId = this.ws.options.gatewayBot.shards - 1;
		this.ws.agent.options.totalShards = this.ws.options.gatewayBot.shards;

		this.ws.shards();
	}

    // USEFUL METHODS

    async editProfile(nick?: string, avatar?: string): Promise<User> {
        const user = await this.rest.patch<DiscordUser>(USER(), {
            username: nick ?? null,
            avatar: avatar ?? null,
        });

        return new User(this, user);
    }

    // END USEFUL METHODS

    // PRESENCE


    /**
     * Edit bot's status
     * tip: execute this on the ready event if possible
     * @example
     * for (const { id } of session.gateway.manager.shards) {
     *    session.editStatus(id, data);
     * }
     */
    editStatus(shardId: number, status: StatusUpdate, prio = true): void {
        const shard = this.ws.agent.shards.get(shardId);

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
                        emoji: activity.emoji && {
                            name: activity.emoji.name,
                            id: activity.emoji.id,
                            animated: activity.emoji.animated,
                        },
                        party: activity.party,
                        assets: activity.assets &&
                            {
                                large_image: activity.assets.largeImage,
                                large_text: activity.assets.largeText,
                                small_image: activity.assets.smallImage,
                                small_text: activity.assets.smallText,
                            },
                        secrets: activity.secrets,
                        instance: activity.instance,
                        flags: activity.flags,
                        buttons: activity.buttons,
                    };
                }),
            },
        }, prio);
    }

    // END PRESENCE

    // INTERACTIONS

    updateApplicationCommandPermissions(
        guildId: Snowflake,
        id: Snowflake,
        bearerToken: string,
        options: ApplicationCommandPermissions[],
    ): Promise<DiscordGuildApplicationCommandPermissions> {
        return this.rest.post<DiscordGuildApplicationCommandPermissions>(
            GUILD_APPLICATION_COMMANDS_PERMISSIONS(this.applicationId, guildId, id),
            {
                permissions: options,
            },
            {
                headers: { 'Authorization': `Bearer ${bearerToken}` },
            },
        );
    }

    fetchApplicationCommand(id: Snowflake, options?: GetApplicationCommand): Promise<DiscordApplicationCommand> {
        return this.rest.get<DiscordApplicationCommand>(
            options?.guildId
                ? GUILD_APPLICATION_COMMANDS_LOCALIZATIONS(
                    this.applicationId,
                    options.guildId,
                    id,
                    options?.withLocalizations,
                )
                : APPLICATION_COMMANDS(this.applicationId, id),
        );
    }

    fetchApplicationCommandPermissions(guildId: Snowflake): Promise<DiscordGuildApplicationCommandPermissions[]> {
        return this.rest.get<DiscordGuildApplicationCommandPermissions[]>(
            GUILD_APPLICATION_COMMANDS_PERMISSIONS(this.applicationId, guildId),
        );
    }

    fetchApplicationCommandPermission(
        guildId: Snowflake,
        id: Snowflake,
    ): Promise<DiscordGuildApplicationCommandPermissions> {
        return this.rest.get<DiscordGuildApplicationCommandPermissions>(
            GUILD_APPLICATION_COMMANDS_PERMISSIONS(this.applicationId, guildId, id),
        );
    }

    upsertApplicationCommand(
        id: Snowflake,
        options: UpsertDataApplicationCommands,
        guildId?: Snowflake,
    ): Promise<DiscordApplicationCommand> {
        return this.rest.patch<DiscordApplicationCommand>(
            guildId
                ? GUILD_APPLICATION_COMMANDS(this.applicationId, guildId)
                : APPLICATION_COMMANDS(this.applicationId, id),
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
        options: UpsertDataApplicationCommands[],
        guildId?: Snowflake,
    ): Promise<DiscordApplicationCommand[]> {
        return this.rest.put<DiscordApplicationCommand[]>(
            guildId
                ? GUILD_APPLICATION_COMMANDS(this.applicationId, guildId)
                : APPLICATION_COMMANDS(this.applicationId),
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
        return this.rest.get<DiscordApplicationCommand[]>(
            guildId
                ? GUILD_APPLICATION_COMMANDS(this.applicationId, guildId)
                : APPLICATION_COMMANDS(this.applicationId),
        );
    }

    isContextApplicationCommand(cmd: LastCreateApplicationCommands): cmd is AtLeastOne<CreateContextApplicationCommand> {
        return cmd.type === ApplicationCommandTypes.Message || cmd.type === ApplicationCommandTypes.User;
    }

    // END INTERACTIONS
}
