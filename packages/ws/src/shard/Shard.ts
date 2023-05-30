import { LeakyBucket } from '../index';
import { ShardGatewayConfig, ShardHeart, ShardCreateOptions } from './ShardTypes';
import { GatewayMemberRequest, RequestGuildMembersOptions, ShardSocketCloseCodes, ShardState, StatusUpdate } from '../SharedTypes';
import {
  APIGuildMember,
  GatewayCloseCodes,
  GatewayDispatchPayload,
  GatewayIntentBits,
  GatewayOpcodes,
  GatewayReceivePayload,
  GatewaySendPayload,
  Collection,
  Logger
} from '@biscuitland/common';
import { WebSocket, CloseEvent, MessageEvent } from 'ws';
import { JoinVoiceOptions } from '../manager/GatewayManagerTypes';

export class Shard {
  /** The id of the shard */
  id: number;
  /** The connection config details that this shard will used to connect to discord. */
  connection: ShardGatewayConfig;
  /** This contains all the heartbeat information */
  heart: ShardHeart;
  /** The maximum of requests which can be send to discord per rate limit tick. Typically this value should not be changed. */
  maxRequestsPerRateLimitTick = 120;
  /** The previous payload sequence number. */
  previousSequenceNumber: number | null = null;
  /** In which interval (in milliseconds) the gateway resets it's rate limit. */
  rateLimitResetInterval = 60000;
  /** Current session id of the shard if present. */
  sessionId?: string;
  /** This contains the WebSocket connection to Discord, if currently connected. */
  socket?: WebSocket;
  /** Current internal state of the this. */
  state = ShardState.Offline;
  /** The url provided by discord to use when resuming a connection for this this. */
  resumeGatewayUrl = '';
  /** Cache for pending gateway requests which should have been send while the gateway went offline. */
  offlineSendQueue: ((_?: unknown) => void)[] = [];
  /** Resolve internal waiting states. Mapped by SelectedEvents => ResolveFunction */
  resolves = new Map<'READY' | 'RESUMED' | 'INVALID_SESSION', (payload: GatewayReceivePayload) => void>();
  /** Shard bucket. Only access this if you know what you are doing. Bucket for handling shard request rate limits. */
  bucket: LeakyBucket;
  logger: Logger;
  /** The payload handlers for messages on the shard. */
  handlePayload: (shardId: number, data: GatewayReceivePayload) => Promise<unknown>;
  cache = {
    requestMembers: {
      /**
       * Whether or not request member requests should be cached.
       * @default false
       */
      enabled: false,
      /** The pending requests. */
      pending: new Collection<string, GatewayMemberRequest>()
    }
  };
  constructor(options: ShardCreateOptions) {
    this.id = options.id;
    this.connection = options.connection;
    this.logger = options.logger;
    this.heart = {
      acknowledged: false,
      interval: 45e3
    };

    if (options.requestIdentify) this.requestIdentify = options.requestIdentify;
    if (options.shardIsReady) this.shardIsReady = options.shardIsReady;

    this.handlePayload = options.handlePayload;

    const safe = this.calculateSafeRequests();

    this.bucket = new LeakyBucket({
      max: safe,
      refillAmount: safe,
      refillInterval: 6e4
    });
  }

  /** The url to connect to. Intially this is the discord gateway url, and then is switched to resume gateway url once a READY is received. */
  get connectionUrl(): string {
    return this.resumeGatewayUrl || this.connection.url;
  }

  /** Check whether the connection to Discord is currently open. */
  get isOpen(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /** Calculate the amount of requests which can safely be made per rate limit interval, before the gateway gets disconnected due to an exceeded rate limit. */
  calculateSafeRequests(): number {
    // * 2 adds extra safety layer for discords OP 1 requests that we need to respond to
    const safeRequests = this.maxRequestsPerRateLimitTick - Math.ceil(this.rateLimitResetInterval / this.heart.interval) * 2;

    return safeRequests < 0 ? 0 : safeRequests;
  }

  async checkOffline(highPriority: boolean) {
    if (!this.isOpen) {
      return new Promise((resolve) => {
        // Higher priority requests get added at the beginning of the array.
        if (highPriority) this.offlineSendQueue.unshift(resolve);
        else this.offlineSendQueue.push(resolve);
      });
    }
  }

  /** Close the socket connection to discord if present. */
  close(code: number, reason: string): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;

    this.socket?.close(code, reason);
  }

  /** Connect the shard with the gateway and start heartbeating. This will not identify the shard to the gateway. */
  async connect(): Promise<Shard> {
    // Only set the shard to `Connecting` state,
    // if the connection request does not come from an identify or resume action.
    if (![ShardState.Identifying, ShardState.Resuming].includes(this.state)) {
      this.state = ShardState.Connecting;
    }

    const url = new URL(this.connectionUrl);
    url.searchParams.set('v', this.connection.version.toString());
    url.searchParams.set('enconding', 'json');

    this.socket = new WebSocket(url.toString());

    this.socket.onerror = (event) => this.logger.info({ error: event, shardId: this.id });
    this.socket.onclose = async (event) => await this.handleClose(event);
    this.socket.onmessage = async (message) => await this.handleMessage(message);

    return new Promise((resolve) => {
      this.socket!.onopen = () => {
        // Only set the shard to `Unidentified` state,
        // if the connection request does not come from an identify or resume action.
        if (![ShardState.Identifying, ShardState.Resuming].includes(this.state)) {
          this.state = ShardState.Unidentified;
        }
        // event connected
        resolve(this);
      };
    });
  }

  /** Identify the shard to the gateway. If not connected, this will also connect the shard to the gateway. */
  async identify() {
    // A new identify has been requested even though there is already a connection open.
    // Therefore we need to close the old connection and heartbeating before creating a new one.
    if (this.isOpen) {
      this.logger.info(`Closing existing shard: #${this.id}`);
      this.close(ShardSocketCloseCodes.ReIdentifying, 'Re-identifying closure of old connection');
    }
    this.state = ShardState.Identifying;
    // identifying
    // It is possible that the shard is in Heartbeating state but not identified,
    // so check whether there is already a gateway connection existing.
    // If not we need to create one before we identify.
    if (!this.isOpen) await this.connect();

    this.send(
      {
        op: GatewayOpcodes.Identify,
        d: {
          token: `Bot ${this.connection.token}`,
          properties: this.connection.properties,
          intents: this.connection.intents,
          shard: [this.id, this.connection.totalShards],
          presence: this.connection.presence
        }
      },
      true
    );

    return new Promise<void>((resolve) => {
      this.resolves.set('READY', () => {
        // event idenfity
        this.shardIsReady();
        resolve();
      });

      // When identifying too fast,
      // Discord sends an invalid session payload.
      // This can safely be ignored though and the shard starts a new identify action.
      this.resolves.set('INVALID_SESSION', () => {
        this.resolves.delete('READY');
        resolve();
      });
    });
  }

  async resume() {
    this.logger.info(`Resuming Shard #${this.id}`);
    // It has been requested to resume the Shards session.
    // It's possible that the shard is still connected with Discord's gateway therefore we need to forcefully close it.
    if (this.isOpen) {
      this.logger.info(`Resuming Shard #${this.id} in isOpen`);
      this.close(ShardSocketCloseCodes.ResumeClosingOldConnection, 'Reconnecting the shard, closing old connection.');
    }

    // Shard has never identified, so we cannot resume.
    if (!this.sessionId) {
      this.logger.info(`Trying to resume a shard #${this.id} that was NOT first identified. (No session id found)`);

      return await this.identify();
    }

    this.state = ShardState.Resuming;

    this.logger.info(`Resuming Shard #${this.id}, before connecting`);
    // Before we can resume, we need to create a new connection with Discord's gateway.
    await this.connect();
    this.logger.info(
      `Resuming Shard #${this.id}, after connecting. ${this.connection.token} | ${this.sessionId} | ${this.previousSequenceNumber}`
    );

    this.send(
      {
        op: GatewayOpcodes.Resume,
        d: {
          token: `Bot ${this.connection.token}`,
          session_id: this.sessionId,
          seq: this.previousSequenceNumber ?? 0
        }
      },
      true
    );
    this.logger.info(`Resuming Shard #${this.id} after send resumg`);

    return new Promise<void>((resolve) => {
      this.resolves.set('RESUMED', () => resolve());
      // If it is attempted to resume with an invalid session id,
      // Discord sends an invalid session payload
      // Not erroring here since it is easy that this happens, also it would be not catchable
      this.resolves.set('INVALID_SESSION', () => {
        this.resolves.delete('RESUMED');
        resolve();
      });
    });
  }

  /**
   * Send a message to Discord Gateway.
   * @param highPriority [highPriority=false] - Whether this message should be send asap.
   */
  async send(message: GatewaySendPayload, highPriority = false) {
    // Before acquiring a token from the bucket, check whether the shard is currently offline or not.
    // Else bucket and token wait time just get wasted.
    await this.checkOffline(highPriority);

    await this.bucket.acquire(highPriority);

    // It's possible, that the shard went offline after a token has been acquired from the bucket.
    await this.checkOffline(highPriority);

    this.socket?.send(JSON.stringify(message));
  }

  /** Shutdown the this. Forcefully disconnect the shard from Discord. The shard may not attempt to reconnect with Discord. */
  async shutdown(): Promise<void> {
    this.close(ShardSocketCloseCodes.Shutdown, 'Shard shutting down.');
    this.state = ShardState.Offline;
  }

  /** Handle a gateway connection close. */
  async handleClose(close: CloseEvent) {
    this.stopHeartbeating();

    switch (close.code) {
      case ShardSocketCloseCodes.TestingFinished:
        this.state = ShardState.Offline;
        // disconnected event
        return;
      // On these codes a manual start will be done.
      case ShardSocketCloseCodes.Shutdown:
      case ShardSocketCloseCodes.ReIdentifying:
      case ShardSocketCloseCodes.Resharded:
      case ShardSocketCloseCodes.ResumeClosingOldConnection:
      case ShardSocketCloseCodes.ZombiedConnection:
        this.state = ShardState.Offline;
        // disconnected event
        return;
      // Gateway connection closes which require a new identify.
      case GatewayCloseCodes.UnknownOpcode:
      case GatewayCloseCodes.NotAuthenticated:
      case GatewayCloseCodes.InvalidSeq:
      case GatewayCloseCodes.RateLimited:
      case GatewayCloseCodes.SessionTimedOut:
        this.logger.info(`Gateway connection closing requiring re-identify. Code: ${close.code}`);
        this.state = ShardState.Identifying;
        // disconnected event
        // @ts-expect-error identify
        return this.idenfity();
      // When these codes are received something went really wrong.
      // On those we cannot start a reconnect attempt.
      case GatewayCloseCodes.AuthenticationFailed:
      case GatewayCloseCodes.InvalidShard:
      case GatewayCloseCodes.ShardingRequired:
      case GatewayCloseCodes.InvalidAPIVersion:
      case GatewayCloseCodes.InvalidIntents:
      case GatewayCloseCodes.DisallowedIntents:
        this.state = ShardState.Offline;
        // disconnected event
        throw new Error(close.reason || 'Discord gave no reason! GG! You broke Discord!');
      default:
        this.logger.info(`Closed shard #${this.id}. Resuming...`);
        // disconnected event
        return this.resume();
    }
  }

  /** Handles a incoming gateway packet. */
  async handleDiscordPacket(packet: GatewayReceivePayload) {
    // Edge case start: https://github.com/discordeno/discordeno/issues/2311
    this.heart.lastAck = Date.now();

    // Manually calculating the round trip time for users who need it.
    if (this.heart.lastBeat && !this.heart.acknowledged) {
      this.heart.rtt = this.heart.lastAck - this.heart.lastBeat;
    }

    this.heart.acknowledged = true;

    switch (packet.op) {
      case GatewayOpcodes.Heartbeat:
        if (!this.isOpen) return await this.resume();
        this.heart.lastBeat = Date.now();
        // Discord randomly sends this requiring an immediate heartbeat back.
        // Using a direct socket.send call here because heartbeat requests are reserved by us.
        this.socket?.send(
          JSON.stringify({
            op: GatewayOpcodes.Heartbeat,
            d: this.previousSequenceNumber
          })
        );
        // hearbeat event
        break;
      case GatewayOpcodes.Hello: {
        const interval = packet.d.heartbeat_interval;
        this.logger.info(`Hello on Shard #${this.id}`);
        this.startHeartbeating(interval);
        break;
      }
    }
    this.handlePayload(this.id, packet);
  }

  /** Handle an incoming gateway message. */
  async handleMessage(message: MessageEvent) {
    const preProcessMessage = message.data;

    if (typeof preProcessMessage !== 'string') return;

    return await this.handleDiscordPacket(JSON.parse(preProcessMessage) as GatewayDispatchPayload);
  }

  /** Start sending heartbeat payloads to Discord in the provided interval. */
  startHeartbeating(interval: number) {
    this.logger.info(`Start heartbeating shard #${this.id}`);
    // If old heartbeast exist like after resume, clear the old ones.
    if (this.heart.intervalId) clearInterval(this.heart.intervalId);
    if (this.heart.timeoutId) clearTimeout(this.heart.timeoutId);

    this.heart.interval = interval;

    // Only set the shard's state to `Unidentified`
    // if heartbeating has not been started due to an identify or resume action.
    if ([ShardState.Disconnected, ShardState.Offline].includes(this.state)) {
      this.logger.info(`[tart Heartbeating Shard #${this.id} a`);
      this.state = ShardState.Unidentified;
    }

    // The first heartbeat needs to be send with a random delay between `0` and `interval`
    // Using a `setTimeout(_, jitter)` here to accomplish that.
    // `Math.random()` can be `0` so we use `0.5` if this happens
    // Reference: https://discord.com/developers/docs/topics/gateway#heartbeating
    const jitter = Math.ceil(this.heart.interval * (Math.random() || 0.5));
    this.heart.timeoutId = setTimeout(() => {
      this.logger.info(`start hearting shard #${this.id} b`);
      if (!this.isOpen) return;
      this.logger.info(`start heartbeting shard #${this.id} c ${this.previousSequenceNumber}`);

      // Using a direct socket.send call here because heartbeat requests are reserved by us.
      this.socket?.send(
        JSON.stringify({
          op: GatewayOpcodes.Heartbeat,
          d: this.previousSequenceNumber
        })
      );

      this.logger.info(`start hearting shard #${this.id} d`);
      this.heart.lastBeat = Date.now();
      this.heart.acknowledged = false;

      // After the random heartbeat jitter we can start a normal interval.
      this.heart.intervalId = setInterval(async () => {
        this.logger.info(`start heartbeating shard #${this.id} e`);
        if (!this.isOpen) return;
        this.logger.info(`start heartbeating shard #${this.id} f`);

        // The Shard did not receive a heartbeat ACK from Discord in time,
        // therefore we have to assume that the connection has failed or got "zombied".
        // The Shard needs to start a re-identify action accordingly.
        // Reference: https://discord.com/developers/docs/topics/gateway#heartbeating-example-gateway-heartbeat-ack
        if (!this.heart.acknowledged) {
          this.logger.info(`heartbeat not acknowledged for shard #${this.id}.`);
          this.close(ShardSocketCloseCodes.ZombiedConnection, 'Zombied connection, did not receive an heartbeat ACK in time.');
          return await this.identify();
        }

        this.heart.acknowledged = false;

        this.logger.info(`start Heartbeating Shard #${this.id} g`);
        // Using a direct socket.send call here because heartbeat requests are reserved by us.
        this.socket?.send(
          JSON.stringify({
            op: GatewayOpcodes.Heartbeat,
            d: this.previousSequenceNumber
          })
        );
        this.heart.lastBeat = Date.now();

        // heartbeat event
      }, this.heart.interval);
    }, jitter);
  }

  /** Stop the heartbeating process with discord. */
  stopHeartbeating(): void {
    // Clear the regular heartbeat interval.
    clearInterval(this.heart.intervalId);
    // It's possible that the Shard got closed before the first jittered heartbeat.
    // To go safe we should clear the related timeout too.
    clearTimeout(this.heart.timeoutId);
  }

  /**
   * Fetches the list of members for a guild over the gateway.
   *
   * @param options - The parameters for the fetching of the members.
   *
   * @remarks
   * If requesting the entire member list:
   * - Requires the `GUILD_MEMBERS` intent.
   *
   * Fires a _Guild Members Chunk_ gateway event for every 1000 members fetched.
   *
   * @see {@link https://discord.com/developers/docs/topics/gateway#request-guild-members}
   */
  async requestMembers(options: { guild_id: string } & Partial<RequestGuildMembersOptions>): Promise<APIGuildMember[]> {
    // You can request 1 member without the intent
    // Check if intents is not 0 as proxy ws won't set intents in other instances
    if (this.connection.intents && (!options.limit || options.limit > 1) && !(this.connection.intents & GatewayIntentBits.GuildMembers))
      throw new Error('MISSING_INTENT_GUILD_MEMBERS');
    if (options.user_ids?.length) {
      this.logger.info(
        `requestMembers guildId: ${options.guild_id} -> setting user limit based on userIds length: ${options.user_ids.length}`
      );
      options.limit = options.user_ids.length;
    }

    const nonce = `${options.guild_id}-${Date.now()}`;

    // Gateway does not require caching these requests so directly send and return
    if (!this.cache.requestMembers.enabled) {
      this.logger.info(`requestMembers guildId: ${options.guild_id} -> skipping cache -> options ${JSON.stringify(options)}`);

      await this.send({
        op: GatewayOpcodes.RequestGuildMembers,
        d: {
          guild_id: options.guild_id,
          // @ts-expect-error
          // If a query is provided use it, OR if a limit is NOT provided use ""
          query: options.query ?? (options.limit ? undefined : ''),
          limit: options.limit ?? 0,
          presences: options.presences ?? false,
          user_ids: options.user_ids,
          nonce
        }
      });
      return [];
    }
    return new Promise((resolve) => {
      this.cache.requestMembers.pending.set(nonce, {
        nonce,
        resolve,
        members: []
      });
      this.logger.info(`requestMembers options.guild_id: ${options.guild_id} -> requesting members -> data: ${JSON.stringify(options)}`);
      this.send({
        op: GatewayOpcodes.RequestGuildMembers,
        d: {
          guild_id: options.guild_id,
          // @ts-expect-error
          // If a query is provided use it, OR if a limit is NOT provided use ""
          query: options?.query ?? (options?.limit ? undefined : ''),
          limit: options?.limit ?? 0,
          presences: options?.presences ?? false,
          user_ids: options?.user_ids,
          nonce
        }
      });
    });
  }

  /**
   * Connects the bot user to a voice or stage channel.
   *
   * This function sends the _Update Voice State_ gateway command over the gateway behind the scenes.
   *
   * @remarks
   * Requires the `CONNECT` permission.
   *
   * Fires a _Voice State Update_ gateway event.
   *
   * @see {@link https://discord.com/developers/docs/topics/gateway#update-voice-state}
   */
  async joinVoiceChannel({ guild_id, channel_id, self_deaf, self_mute }: JoinVoiceOptions) {
    this.logger.info(`joinVoiceChannel guildId: ${guild_id} channelId: ${channel_id}`);
    await this.send({
      op: GatewayOpcodes.VoiceStateUpdate,
      d: {
        guild_id,
        channel_id,
        self_mute: Boolean(self_mute),
        self_deaf: self_deaf ?? true
      }
    });
  }

  /**
   * Leaves the voice channel the bot user is currently in.
   *
   * This function sends the _Update Voice State_ gateway command over the gateway behind the scenes.
   *
   * @param guildId - The ID of the guild the voice channel to leave is in.
   *
   * @remarks
   * Fires a _Voice State Update_ gateway event.
   *
   * @see {@link https://discord.com/developers/docs/topics/gateway#update-voice-state}
   */
  async leaveVoiceChannel(guild_id: string) {
    this.logger.info(`leaveVoiceChannel guildId: ${guild_id} Shard ${this.id}`);
    await this.send({
      op: GatewayOpcodes.VoiceStateUpdate,
      d: {
        guild_id,
        channel_id: null,
        self_deaf: false,
        self_mute: false
      }
    });
  }

  /**
   * Edits the bot's status on one shard.
   *
   * @param shardId The shard id to edit the status for.
   * @param data The status data to set the bots status to.
   */
  async editShardStatus(data: Required<StatusUpdate>) {
    this.logger.info(`editShardStatus shardId: ${this.id} -> data: ${JSON.stringify(data)}`);
    await this.send({
      op: GatewayOpcodes.PresenceUpdate,
      d: {
        since: null,
        afk: false,
        activities: data.activities,
        status: data.status
      }
    });
  }

  /** This function communicates with the management process, in order to know whether its free to identify. When this function resolves, this means that the shard is allowed to send an identify payload to discord. */
  async requestIdentify(): Promise<void> {}

  /** This function communicates with the management process, in order to tell it can identify the next shard. */
  async shardIsReady(): Promise<void> {}
}
