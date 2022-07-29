import './utils/experimental.util';
import 'dotenv/config';

import { colors } from './utils/colors.util';

import { DefaultRestAdapter } from '@biscuitland/rest';
import { DefaultWsAdapter } from '@biscuitland/ws';

import { GatewayIntents } from '@biscuitland/api-types';
import { Biscuit } from '@biscuitland/core';

import { ReadyEvent } from './operations';
import { MeRest } from './operations';

import { AgentWs } from './operations';

const argv = process.argv.slice(2);

const boostrap = async () => {
	const biscuit = new Biscuit({
		intents: GatewayIntents.Guilds,
		token: process.env.AUTH!,
	});

	await biscuit.start();
	await operations(biscuit);
};

const operations = async (biscuit: Biscuit) => {
	switch (argv[0]) {
		case '--events':
			console.log(colors.cyan('Starting examples of events'));

			switch (argv[1]) {
				case 'ready':
					new ReadyEvent(biscuit.events);

					break;
			}

			break;

		case '--rest':
			console.log(colors.cyan('Starting examples of rest'));

			switch (argv[1]) {
				case 'me':
					new MeRest(biscuit.rest as DefaultRestAdapter);

					break;
			}

			break;

		case '--ws':
			console.log(colors.cyan('Starting examples of ws'));

			switch (argv[1]) {
				case 'agent':
					new AgentWs(biscuit.ws as DefaultWsAdapter);

					break;
			}

			break;
	}
};

boostrap();
