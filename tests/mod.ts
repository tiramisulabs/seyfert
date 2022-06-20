import * as Discord from "./deps.ts";

const session = new Discord.Session({
	token: Deno.args[0],
});

session.on("ready", (payload) => console.log(payload));
session.on("raw", (shard, data) => console.log(shard, data));
session.on("debug", (text) => console.log(text));

session.start();