import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bundlePackage } from '../src/bundle.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = join(here, 'fixtures/plugin-with-css');
const dist = join(fixture, 'dist');
const pkg = JSON.parse(readFileSync(join(fixture, 'package.json'), 'utf8'));

const read = (file: string): string => readFileSync(join(dist, file), 'utf8');
const CSS_TOKEN = '--swup-test-plugin-duration';

describe('bundlePackage', () => {
	beforeAll(async () => {
		rmSync(dist, { recursive: true, force: true });
		await bundlePackage(pkg, { cwd: fixture });
	});

	afterAll(() => rmSync(dist, { recursive: true, force: true }));

	it('emits one file per export format', () => {
		for (const file of ['index.js', 'index.cjs', 'index.iife.js', 'index.d.ts']) {
			expect(existsSync(join(dist, file)), `expected ${file}`).toBe(true);
		}
	});

	it('inlines CSS instead of emitting a separate stylesheet', () => {
		const cssFiles = readdirSync(dist).filter((file) => file.endsWith('.css'));
		expect(cssFiles).toEqual([]);
	});

	describe('export formats', () => {
		it('builds an ES module (`module`)', () => {
			const code = read('index.js');
			expect(code).toContain('export {');
			expect(code).toContain('as default');
			expect(code).not.toContain('module.exports');
		});

		it('builds a CommonJS module (`main`)', () => {
			const code = read('index.cjs');
			expect(code).toContain('module.exports');
			expect(code).not.toMatch(/export\s*\{/);
		});

		it('builds an IIFE bundle exposing the global name (`unpkg`)', () => {
			const code = read('index.iife.js');
			expect(code).toMatch(/var SwupTestPlugin\s*=/);
			expect(code).toContain('(function(');
		});

		it('emits type declarations (`types`)', () => {
			expect(read('index.d.ts')).toContain('declare class SwupTestPlugin');
		});
	});

	describe('CSS bundling', () => {
		it('inlines the CSS as a string into every JS format', () => {
			expect(read('index.js'), 'esm').toContain(CSS_TOKEN);
			expect(read('index.cjs'), 'cjs').toContain(CSS_TOKEN);
			expect(read('index.iife.js'), 'iife').toContain(CSS_TOKEN);
		});

		it('minifies the inlined CSS', () => {
			// `0.4s` -> `.4s` and selectors collapse onto the rule with no whitespace
			const code = read('index.js');
			expect(code).toContain('.4s');
			expect(code).toMatch(/swup-transition-main\{opacity:1/);
		});
	});

	it('throws when the package has no `source` field', async () => {
		await expect(bundlePackage({ amdName: 'SwupTestPlugin' }, { cwd: fixture })).rejects.toThrow(
			/missing `source`/
		);
	});
});
