const { join } = require('node:path');

// Deno copies linked packages, so resolve the generated checkout from the test process root.
module.exports = (path) => require(join(process.cwd(), 'lib', path));
