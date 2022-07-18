// Biscuit Discord library showcase

import Biscuit, { GatewayIntents } from 'https://deno.land/x/biscuit/mod.ts';

const intents = GatewayIntents.MessageContent | GatewayIntents.Guilds | GatewayIntents.GuildMessages;
const session = new Biscuit({ token: Deno.args[0], intents });

session.on('ready', ({ user }) => {
    console.log('Logged in as: %s!\nUse !ping to get a reply', user.username);
});

session.on('messageCreate', (message) => {
    if (message.content.startsWith('!ping')) {
        message.reply({ content: 'pong!' });
    }
});

session.start();
