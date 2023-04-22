const { BiscuitREST } = require('../rest/dist');
const { Routes } = require('discord-api-types/v10');
const { GatewayManager } = require('./dist');

const token = 'MTA0NTE4MzM1MzY1MDk1MDE0Ng.Gea7SP.LrMAzEG8Dk7RY9mHomOReU2ZUrakWozZupzC00';

const rest = new BiscuitREST({ token, version: '10' });

(async () => {
	console.log(Routes.gatewayBot());
	const connection = await rest.get(Routes.gatewayBot());
	console.debug(connection);
	const manager = new GatewayManager({ token, connection });

	await manager.spawnShards();
})();
