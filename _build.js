const { execSync } = require("child_process");

const commands = [
	'tsc',
	'bunx tsc',
	'npx tsc',
	'pnpx tsc'
]

function executeCommands() {
	for (const cmd of commands) {
		try {
			console.log('[Seyfert]:', 'trying to build with `', cmd, '`')
			execSync(cmd)
		} catch (e) {
			if (cmd === commands.at(-1)) {
				return console.log('[Seyfert]:', e)
			}
		}
	}

	console.log('[Seyfert]:', 'builded')
}

executeCommands()
