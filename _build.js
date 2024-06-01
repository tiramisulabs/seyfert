const { execSync } = require("child_process");

try {
	execSync('tsc');
	console.log('Builded');
} catch (e) {
	console.error(e);
	console.log('Builded with errors');
}
