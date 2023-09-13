import * as fs from 'fs/promises'
import { URL } from 'url'
import { join } from 'path'

import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import Crawler from 'crawler'
import { Listr, ListrTask } from 'listr2'
import { Browser } from 'playwright'

import { createBrowser, visitPage } from '../browser.js'
import { isUrl, isValidUrl, n } from '../util.js'
import { loadConfig, type Config } from '../config.js'

interface Ctx {
	config: Config
	browser?: Browser
	teardown?: () => Promise<void>
	urls: string[]
}

export default class Validate extends Command {
	static summary = 'Validate a swup-powered site'
	static description = 'Crawl your site and validate that all pages are accessible and render correctly'
	static examples = [
		`<%= config.bin %> <%= command.id %>`,
		`<%= config.bin %> <%= command.id %> --url https://mysite.com/about`,
		`<%= config.bin %> <%= command.id %> --crawl --url https://mysite.com`,
		`<%= config.bin %> <%= command.id %> --tests containers,transition-duration`,
		`<%= config.bin %> <%= command.id %> --asynchronous`,
	]
	static flags = {
		url: Flags.string({
			char: 'u',
			summary: 'URL',
			description: 'Base URL to validate. Will validate this single URL only, unless --crawl is specified.',
			required: false,
			exclusive: ['sitemap'],
		}),
		crawl: Flags.boolean({
			char: 'c',
			summary: 'Crawl site',
			description: 'Crawl the site for all public URLs and validate all found pages. Requires the --url flag as a base URL.',
			required: false,
		}),
		sitemap: Flags.string({
			char: 's',
			summary: 'Sitemap',
			description: 'If no URL is passed, the local sitemap file will be scanned for public URLs. Accepts a local filepath or URL.',
			required: false,
			exclusive: ['url'],
		}),
		tests: Flags.string({
			char: 't',
			summary: 'Tests',
			description: 'Specify which tests to run when validating. Defaults to all.',
			required: false,
			options: ['all', 'containers', 'transition-duration', 'transition-styles'],
			default: 'all',
		}),
		parallel: Flags.boolean({
			char: 'p',
			summary: 'Parallel',
			description: 'Run all tests asynchronously. A lot faster, but might cause issues.',
			required: false,
		}),
		containers: Flags.string({
			summary: 'Containers',
			description: 'Selectors of containers to validate, separated by comma.',
			required: false,
			default: '#swup',
		}),
		animation: Flags.string({
			summary: 'Animation selector',
			description: 'Selector of elements that should be animated.',
			required: false,
			default: '[class*="transition-"]',
		}),
		styles: Flags.string({
			summary: 'Expected styles',
			description: 'CSS properties expected to change during animations, separated by comma.',
			required: false,
			default: 'opacity,transform',
		}),
	}

	async run(): Promise<void> {
		const ctx: Ctx = {
			config: await this.parseConfig(),
			urls: []
		}

		const tasks: ListrTask<Ctx>[] = [
			{
				title: 'Setting up',
				task: async (ctx, task) => task.newListr(() => [
						{
							title: 'Launching browser',
							task: async (ctx) => {
								const { browser, teardown } = await createBrowser()
								ctx.browser = browser
								ctx.teardown = teardown
							}
						},
					]
				)
			},
			{
				title: 'Compiling pages',
				task: async (ctx, task): Promise<void> => {
					const { source, urls } = await this.getPageUrls(ctx)
					ctx.urls = urls
					task.title = chalk`Found {green ${urls.length} ${n(urls.length, 'page')}} in {magenta ${source}}`
				}
			},
			{
				title: 'Shutting down',
				task: async (ctx, task) => task.newListr(() => [
					{
						title: 'Closing browser',
						task: async (ctx) => {
							await ctx.teardown!()
							ctx.teardown = undefined
						}
					}
				])
			}
		]

		try {
			await new Listr<Ctx>(tasks, { ctx }).run()
		} catch (error) {
			if (ctx.teardown) {
				await ctx.teardown()
			}
			throw error
		}
	}

	async catch(error: Error) {
		// this.error(error as Error)
		throw error
	}

	async parseConfig(): Promise<Config> {
		const { flags } = await this.parse(Validate)
		const overrides = {
			swup: {
				animationSelector: flags.animationSelector,
				containers: flags.containers.split(','),
			},
			validate: {
				url: flags.url,
				crawl: flags.crawl,
				sitemap: flags.sitemap,
				asynchronous: flags.asynchronous,
				tests: flags.tests.split(','),
				styles: flags.styles.split(','),
			}
		}
		return await loadConfig(overrides)
	}

	async getPageUrls(ctx: Ctx): Promise<{ urls: string[], source: string }> {
		const { url, crawl, sitemap } = ctx.config.validate
		let urls: string[] = []
		let source = ''
		if (url) {
			if (!isValidUrl(url)) {
				throw new Error(`Invalid URL: ${url}. Make sure you include the protocol and hostname.`)
			}
			if (crawl) {
				source = 'crawled site'
				urls = await this.getPageUrlsFromCrawler(ctx)
			} else {
				source = 'url argument'
				urls = [url]
			}
		} else if (sitemap) {
			source = 'parsed sitemap'
			urls = await this.getPageUrlsFromSitemap(ctx)
		} else {
			throw new Error('You must specify either a url or a sitemap to validate.')
		}
		return { urls, source }
	}

	getPageUrlsFromCrawler(ctx: Ctx): Promise<string[]> {
		const urls: string[] = []
		const base = new URL(ctx.config.validate.url)
		return new Promise((resolve) => {
			const crawler = new Crawler({
				maxConnections: 10,
				skipDuplicates: true,
				callback: (error, res, done) => {
					const $ = res.$
					if (error) {
						console.warn(error)
					}
					if (!$) {
						done()
						return
					}

					urls.push(res.request.uri.href)

					$('a[href]:not([download]):not([target="_blank"])').each((i, el) => {
						const href = String($(el).attr('href')).trim()
						if (href) {
							const link = new URL(href, base)
							if (isValidUrl(link) && this.isLocalUrl(link, base)) {
								crawler.queue(link.href)
							}
						}
					})

					setTimeout(done) // I guess Cheerio dom reading is slow?
				},
			})

			crawler.on('drain', () => resolve(urls))
			crawler.queue(base.href)
		})
	}

	isLocalUrl(url: URL, base: URL): boolean {
		if (url.origin !== base.origin) {
			return false
		}
		if (url.pathname.match(/\.jpe?g|a?png|gif|pdf$/i)) {
			return false
		}
		return true
	}

	async getPageUrlsFromSitemap(ctx: Ctx): Promise<string[]> {
		const { sitemap } = ctx.config.validate
		let contents
		if (isUrl(sitemap)) {
			try {
				contents = await (fetch(sitemap).then(res => res.text()))
			} catch (error) {
				throw new Error(`Error fetching sitemap: ${error}`)
			}
		} else {
			try {
				contents = await fs.readFile(join(process.cwd(), sitemap), 'utf8')
			} catch (error) {
				throw new Error(`Error reading sitemap: ${error}`)
			}
		}

		// return (JSON.parse(parser.toJson(sitemap)).urlset.url.map(i => i.loc))
		return []
	}
}
