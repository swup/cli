import * as fs from 'fs/promises';
import { join } from 'path';

import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { Listr, ListrTask } from 'listr2';
import { Browser } from 'playwright';

import {
	crawlSiteForUrls,
	createBrowser,
	validateAnimationDuration,
	validateAnimationStyles,
	visitPage
} from '../browser.js';
import { getLocalUrl, isUrl, isValidUrl, n } from '../util.js';
import { loadConfig, type Config } from '../config.js';

interface Ctx {
	config: Config;
	browser?: Browser;
	teardown?: () => Promise<void>;
	urls: string[];
	errors: Error[];
}

export default class Validate extends Command {
	static summary = 'Validate a swup-powered site';
	static description =
		'Crawl your site and validate that all pages are accessible and render correctly';
	static examples = [
		`<%= config.bin %> <%= command.id %>`,
		`<%= config.bin %> <%= command.id %> --url https://mysite.com/about`,
		`<%= config.bin %> <%= command.id %> --crawl --url https://mysite.com`,
		`<%= config.bin %> <%= command.id %> --tests containers,transition-duration`,
		`<%= config.bin %> <%= command.id %> --asynchronous`
	];
	static flags = {
		url: Flags.string({
			char: 'u',
			summary: 'URL',
			description:
				'Base URL to validate. Will validate this single URL only, unless --crawl is specified.',
			required: false,
			exclusive: ['sitemap']
		}),
		crawl: Flags.boolean({
			char: 'c',
			summary: 'Crawl site',
			description:
				'Crawl the site for all public URLs and validate all found pages. Requires the --url flag as a base URL.',
			required: false
		}),
		limit: Flags.string({
			char: 'l',
			summary: 'Limit',
			description:
				'Limit the number of pages to validate when crawling or reading from a sitemap.',
			required: false
		}),
		sitemap: Flags.string({
			char: 's',
			summary: 'Sitemap',
			description:
				'If no URL is passed, the local sitemap file will be scanned for public URLs. Accepts a local filepath or URL.',
			required: false,
			exclusive: ['url']
		}),
		tests: Flags.string({
			char: 't',
			summary: 'Tests',
			description: 'Specify which tests to run when validating. Defaults to all.',
			required: false,
			options: ['all', 'containers', 'transition-duration', 'transition-styles'],
			default: 'all'
		}),
		parallel: Flags.boolean({
			char: 'p',
			summary: 'Parallel',
			description: 'Run all tests asynchronously. A lot faster, but might cause issues.',
			required: false
		}),
		containers: Flags.string({
			summary: 'Containers',
			description: 'Selectors of containers to validate, separated by comma.',
			required: false,
			default: '#swup'
		}),
		animation: Flags.string({
			summary: 'Animation selector',
			description: 'Selector of elements that should be animated.',
			required: false,
			default: '[class*="transition-"]'
		}),
		styles: Flags.string({
			summary: 'Expected styles',
			description: 'CSS properties expected to change during animations, separated by comma.',
			required: false,
			default: 'opacity,transform'
		})
	};

	async run(): Promise<void> {
		const ctx: Ctx = {
			config: await this.parseConfig(),
			urls: [],
			errors: []
		};

		const tasks: ListrTask<Ctx>[] = [
			{
				title: 'Set up',
				task: async (ctx, task) => {
					return task.newListr(() => [
						{
							title: 'Launch browser',
							task: async (ctx) => {
								const { browser, teardown } = await createBrowser();
								ctx.browser = browser;
								ctx.teardown = teardown;
							}
						}
					]);
				}
			},
			{
				title: 'Compile pages',
				task: async (ctx, task) => {
					const { source, urls } = await this.getPageUrls(ctx);
					ctx.urls = urls;
					task.title = chalk`Found {blue ${urls.length} ${n(
						urls.length,
						'page'
					)}} in {magenta ${source}}`;
				}
			},
			{
				title: 'Limit pages',
				enabled: (ctx) => ctx.config.validate.limit > 0 && ctx.urls.length > ctx.config.validate.limit,
				task: async (ctx, task) => {
					ctx.urls = ctx.urls.slice(0, ctx.config.validate.limit);
					task.title = chalk`Limiting to {blue ${ctx.urls.length} ${n(ctx.urls.length, 'page')}}`;
				}
			},
			{
				title: 'Validate pages',
				task: async (ctx, task) => {
					return task.newListr(
						ctx.urls.map((url, index) => ({
							title: `Validating ${getLocalUrl(url)}`,
							task: async (_, subtask) => {
								try {
									await this.validatePage(ctx, url);
									subtask.title = chalk`{green Validated} ${getLocalUrl(url)}`;
								} catch (error) {
									ctx.errors.push(error as Error);
									subtask.title = chalk`{red Failed} ${getLocalUrl(url)}`;
								}
							}
						})),
						{ exitOnError: false, concurrent: ctx.config.validate.parallel }
					);
				}
			},
			{
				title: 'Report results',
				task: async ({ errors, urls: { length: total } }, task) => {
					if (errors.length) {
						errors.forEach((error) => this.warn(error));
						this.error(
							chalk`{red.bold Validation failed} for {red ${errors.length}/${total}} ${n(
								total,
								'page'
							)}`
						);
					} else {
						task.title = chalk`{green.bold Validation passed} for {green ${total}/${total}} ${n(
							total,
							'page'
						)}`;
					}
				}
			},
			{
				title: 'Shut down',
				task: async (ctx, task) =>
					task.newListr(() => [
						{
							title: 'Closing browser',
							task: async (ctx) => {
								await ctx.teardown!();
								ctx.teardown = undefined;
							}
						}
					])
			}
		];

		try {
			await new Listr<Ctx>(tasks, { ctx }).run();
		} catch (error) {
			if (ctx.teardown) {
				await ctx.teardown();
			}
			throw error;
		}
	}

	async catch(error: Error) {
		// this.error(error as Error)
		throw error;
	}

	async parseConfig(): Promise<Config> {
		const { flags } = await this.parse(Validate);
		const overrides = {
			swup: {
				animationSelector: flags.animationSelector,
				containers: flags.containers.split(',').map((style) => style.trim())
			},
			validate: {
				url: flags.url,
				crawl: flags.crawl,
				sitemap: flags.sitemap,
				limit: Number(flags.limit),
				asynchronous: flags.asynchronous,
				tests: flags.tests
					.split(',')
					.map((style) => style.trim())
					.filter((test) => test && test !== 'all'),
				styles: flags.styles.split(',').map((style) => style.trim())
			}
		};
		return await loadConfig(overrides);
	}

	async getPageUrls(ctx: Ctx): Promise<{ urls: string[]; source: string }> {
		const { url, crawl, sitemap } = ctx.config.validate;
		let urls: string[] = [];
		let source = '';
		if (url) {
			if (!isValidUrl(url)) {
				throw new Error(
					`Invalid URL: ${url}. Make sure you include the protocol and hostname.`
				);
			}
			if (crawl) {
				source = 'crawled site';
				urls = await crawlSiteForUrls(url);
			} else {
				source = 'url argument';
				urls = [url];
			}
		} else if (sitemap) {
			source = 'parsed sitemap';
			urls = await this.getPageUrlsFromSitemap(ctx);
		} else {
			throw new Error('You must specify either a url or a sitemap to validate.');
		}
		urls = [...new Set(urls)];
		return { urls, source };
	}

	async getPageUrlsFromSitemap(ctx: Ctx): Promise<string[]> {
		const { sitemap } = ctx.config.validate;
		let contents;
		if (isUrl(sitemap)) {
			try {
				contents = await fetch(sitemap).then((res) => res.text());
			} catch (error) {
				throw new Error(`Error fetching sitemap: ${error}`);
			}
		} else {
			try {
				contents = await fs.readFile(join(process.cwd(), sitemap), 'utf8');
			} catch (error) {
				throw new Error(`Error reading sitemap: ${error}`);
			}
		}

		// return (JSON.parse(parser.toJson(sitemap)).urlset.url.map(i => i.loc))
		return [];
	}

	async validatePage(ctx: Ctx, url: string): Promise<void> {
		const { tests, styles } = ctx.config.validate;
		const { animationSelector } = ctx.config.swup;
		const { browser } = ctx;
		const page = await visitPage(browser!, url);
		const allChecks = {
			'transition-duration': () => validateAnimationDuration(page, animationSelector),
			'transition-styles': () => validateAnimationStyles(page, animationSelector, styles)
		};
		const checks = Object.entries(allChecks).filter(
			([test]) => !tests.length || tests.includes(test)
		);
		if (!checks.length) {
			throw new Error(
				`No valid tests specified. Available tests: ${Object.keys(allChecks).join(', ')}`
			);
		}
		for (const [, test] of checks) {
			try {
				await test();
			} catch (error) {
				throw new Error(
					chalk`Validation {red failed} for {magenta ${getLocalUrl(url)}}: ${error}`
				);
			}
		}
	}
}
