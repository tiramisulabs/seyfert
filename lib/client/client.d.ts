import { type GatewayDispatchPayload, type GatewayPresenceUpdateData } from 'discord-api-types/v10';
import type { CommandContext, Message } from '..';
import { type Awaitable, type DeepPartial, type If } from '../common';
import { EventHandler } from '../events';
import { ShardManager, type ShardManagerOptions } from '../websocket';
import { MemberUpdateHandler } from '../websocket/discord/events/memberUpdate';
import { PresenceUpdateHandler } from '../websocket/discord/events/presenceUpdate';
import type { BaseClientOptions, ServicesOptions, StartOptions } from './base';
import { BaseClient } from './base';
import { Collectors } from './collectors';
import { type ClientUserStructure, type MessageStructure } from './transformers';
export declare class Client<Ready extends boolean = boolean> extends BaseClient {
    private __handleGuilds?;
    gateway: ShardManager;
    me: If<Ready, ClientUserStructure>;
    options: Omit<ClientOptions, 'commands'> & {
        commands: NonNullable<ClientOptions['commands']>;
    };
    memberUpdateHandler: MemberUpdateHandler;
    presenceUpdateHandler: PresenceUpdateHandler;
    collectors: Collectors;
    events?: EventHandler | undefined;
    constructor(options?: ClientOptions);
    setServices({ gateway, ...rest }: ServicesOptions & {
        gateway?: ShardManager;
        handlers?: ServicesOptions['handlers'] & {
            events?: EventHandler['callback'];
        };
    }): void;
    loadEvents(dir?: string): Promise<void>;
    protected execute(options?: {
        token?: string;
        intents?: number;
    }): Promise<void>;
    start(options?: Omit<DeepPartial<StartOptions>, 'httpConnection'>, execute?: boolean): Promise<void>;
    protected onPacket(shardId: number, packet: GatewayDispatchPayload): Promise<void>;
}
export interface ClientOptions extends BaseClientOptions {
    presence?: (shardId: number) => GatewayPresenceUpdateData;
    shards?: {
        start: number;
        end: number;
        total?: number;
    };
    gateway?: {
        properties?: Partial<ShardManagerOptions['properties']>;
        compress?: ShardManagerOptions['compress'];
    };
    commands?: BaseClientOptions['commands'] & {
        prefix?: (message: MessageStructure) => Awaitable<string[]>;
        deferReplyResponse?: (ctx: CommandContext) => Parameters<Message['write']>[0];
        reply?: (ctx: CommandContext) => boolean;
    };
    handlePayload?: ShardManagerOptions['handlePayload'];
}
