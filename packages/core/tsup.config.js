"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tsup_1 = require("tsup");
const isProduction = process.env.NODE_ENV === 'production';
exports.default = (0, tsup_1.defineConfig)({
    clean: true,
    dts: true,
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    minify: isProduction,
    sourcemap: false,
});
