const { WorkerClient } = require('../lib/client/workerclient');

const client = new WorkerClient({});
client.handleManagerMessages({
	type: 'HEARTBEAT',
	incarnationId: process.env.SEYFERT_WORKER_INCARNATIONID,
}).catch(error => {
	process.send?.({ type: 'BOOTSTRAP_ERROR', error: String(error) });
});
