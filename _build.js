const { execSync } = require("child_process");

try {
	execSync('tsc');
	console.log('[Seyfert]: Builded');
} catch (e) {
	console.error(e);
	console.log('[Seyfert]: Builded with errors');
}
