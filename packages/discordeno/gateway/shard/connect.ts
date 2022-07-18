import { Shard, ShardState } from './types.ts';

// TODO: Remove code marked WSL GATEWAY PATCH once a bug in bun is fixed:
//   `https://github.com/Jarred-Sumner/bun/issues/521`

export async function connect(shard: Shard): Promise<void> {
    let gotHello = false;

    // Only set the shard to `Connecting` state,
    // if the connection request does not come from an identify or resume action.
    if (![ShardState.Identifying, ShardState.Resuming].includes(shard.state)) {
        shard.state = ShardState.Connecting;
    }
    shard.events.connecting?.(shard);

    // Explicitly setting the encoding to json, since we do not support ETF.
    const socket = new WebSocket(`${shard.gatewayConfig.url}/?v=${shard.gatewayConfig.version}&encoding=json`);
    shard.socket = socket;

    // TODO: proper event handling
    socket.onerror = (event) => console.log({ error: event });

    socket.onclose = (event) => shard.handleClose(event);

    socket.onmessage = (message) => {
        // START WSL GATEWAY PATCH
        gotHello = true;
        // END WSL GATEWAY PATCH
        shard.handleMessage(message);
    };

    return new Promise((resolve) => {
        socket.onopen = () => {
            // START WSL GATEWAY PATCH
            setTimeout(() => {
                if (!gotHello) {
                    shard.handleMessage({
                        data: JSON.stringify({ t: null, s: null, op: 10, d: { heartbeat_interval: 41250 } }),
                    } as any);
                }
            }, 250);
            // END WSL GATEWAY PATCH

            // Only set the shard to `Unidentified` state,
            // if the connection request does not come from an identify or resume action.
            if (![ShardState.Identifying, ShardState.Resuming].includes(shard.state)) {
                shard.state = ShardState.Unidentified;
            }
            shard.events.connected?.(shard);

            resolve();
        };
    });
}
