import workerClientModule from '../../lib/client/workerclient.js';

const { WorkerClient } = workerClientModule;

process.once('disconnect', async () => {
	try {
		await new WorkerClient().postMessage({ type: 'ACK_HEARTBEAT', workerId: 0 });
		process.stdout.write('UNEXPECTED_SUCCESS\n', () => process.exit(1));
	} catch (error) {
		const code = error instanceof Error && 'code' in error ? error.code : 'UNKNOWN_ERROR';
		process.stdout.write(`${code}\n`, () => process.exit(code === 'ERR_IPC_CHANNEL_CLOSED' ? 0 : 1));
	}
});

process.send?.({ type: 'READY' });
