import { DefaultWsAdapter } from '@biscuitland/ws';

export class AgentWs {
	ws: DefaultWsAdapter;

	constructor(ws: DefaultWsAdapter) {
		this.ws = ws;

		if (ws) {
			this.execute();
		}
	}

	async execute() {
		const shard = this.ws.agent.shards.get(0);

		if (shard && shard.socket) {
			shard.socket.onmessage = (_message: any) => {
				// operations
			};
		}
	}
}
