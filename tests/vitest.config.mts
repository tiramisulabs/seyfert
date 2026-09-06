import { defineConfig } from 'vitest/config';

export default defineConfig({
	oxc: {
		decorator: { emitDecoratorMetadata: true, legacy: true },
	},
	test: {
		fileParallelism: false,
		isolate: false,
		setupFiles: ['./tests/setup.mts'],
	},
});
