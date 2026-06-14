import { build, type Format } from 'tsdown';

interface PluginPackage {
	name?: string;
	source?: string;
	amdName?: string;
}

interface BundleOptions {
	/** Watch for changes and rebuild (development mode) */
	watch?: boolean;
}

/*
 * Bundle a swup plugin/theme package using tsdown.
 *
 * Produces the following files, matching field names in plugin package.json:
 * `module` -> `dist/index.js`      ESM, dependencies externalised
 * `main`   -> `dist/index.cjs`     CommonJS
 * `types`  -> `dist/index.d.ts`    Type declarations
 * `unpkg`  -> `dist/index.iife.js` IIFE/CDN, all dependencies bundled
 *
 * CSS is processed, minified and inlined into the JS output.
 */
export async function bundlePackage(
	pckg: unknown,
	{ watch = false }: BundleOptions = {}
): Promise<void> {
	const pkg = (pckg ?? {}) as PluginPackage;

	if (!pkg.source) {
		throw new Error('package.json missing `source` property');
	}

	const entry = { index: pkg.source };
	const globalName = pkg.amdName;

	const shared = {
		entry,
		platform: 'browser' as const,
		config: false as const,
		css: { minify: true },
		logLevel: 'warn' as const
	};

	if (watch) {
		// Development: fast ESM-only build, rebuild on change.
		await build({
			...shared,
			format: ['esm'] as Format[],
			dts: false,
			minify: false,
			clean: true,
			watch: true,
			outExtensions: () => ({ js: '.js' })
		});
		return;
	}

	// Module build: ESM + CJS + declarations, dependencies kept external.
	await build({
		...shared,
		format: ['esm', 'cjs'] as Format[],
		dts: true,
		minify: false,
		clean: true,
		outExtensions: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' })
	});

	// Standalone build: IIFE with all dependencies bundled and a global export.
	await build({
		...shared,
		format: ['iife'] as Format[],
		globalName,
		minify: true,
		dts: false,
		clean: false,
		deps: { alwaysBundle: [/.*/] }
	});
}
