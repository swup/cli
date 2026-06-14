import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/**/*.test.ts'],
		// Bundling tests chdir and shell out to tsdown; keep them serial and patient.
		fileParallelism: false,
		testTimeout: 60000,
		hookTimeout: 60000
	}
});
