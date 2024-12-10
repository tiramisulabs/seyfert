const { Client } = require('../lib')
const { GatewayIntentBits } = require('../lib/types');

const client = new Client({
	getRC: () => {
		return {
			intents: GatewayIntentBits.NonPrivilaged,
			token: process.env.BOT_TOKEN,
			locations: {
				base: '',
				output: '',
			},
			debug: true
		};
	},
});

client.events.onFail = (event, err) => {
	client.logger.error(`${event}: ${err}`);
	process.exit(1);
};

client.start().then(() => {
	setTimeout(() => {
		process.exit(0);
	}, 15_000 * client.gateway.totalShards)
});