import * as fs from 'fs/promises'

import { join } from 'path'
import { Command, Flags } from '@oclif/core'
// @ts-ignore
import Crawler from 'crawler'
import chalk from 'chalk'
import { Listr, ListrTask } from 'listr2'
import { Browser } from 'playwright'

import { createBrowser } from '../browser.js'
import { isUrl } from '../util.js'

interface ConfigFile {
	swup?: object
	validate?: object
}

interface Config {
	animationSelector: string
	containers: string[]
	stylesExpectedToChange: string[]
	sitemap: string
	asynchronous: boolean
	baseUrl?: string
	runTests: string
	testUrl?: string
}

interface Ctx extends Config {
	browser?: Browser
	teardown?: () => Promise<void>
}

export default class Validate extends Command {
	static summary = 'Validate a swup-powered site'
	static description = 'Crawl your site and validate that all pages are accessible and render correctly'
	static examples = [
		`<%= config.bin %> <%= command.id %> --name SwupExamplePlugin`,
		`<%= config.bin %> <%= command.id %> --name SwupExampleTheme --type theme`,
	]
	static flags = {
		config: Flags.string({
			char: 'c',
			description: 'Defines path of swup config file.',
			required: false,
			default: 'swup.config.js',
		}),
		testUrl: Flags.string({
			char: 'u',
			description: 'Run tests for single URL.',
			required: false,
		}),
		runTests: Flags.string({
			char: 't',
			description: 'Run only specific test.',
			required: false,
			default: 'all',
			options: ['all', 'containers', 'transition-duration', 'transition-styles'],
		}),
		baseUrl: Flags.string({
			char: 'b',
			description: 'Crawl site based on defined base URL and find URLs to check automatically (pages that are not linked from other pages, like 404, won\'t be checked)',
			required: false,
		}),
		containers: Flags.string({
			char: 'o',
			description: 'Container selectors separated by a comma (,)',
			required: false,
			default: '#swup',
		}),
		stylesExpectedToChange: Flags.string({
			char: 's',
			description: 'Styles expected to change separated by a comma (,)',
			required: false,
			default: 'opacity,transform',
		}),
		sitemap: Flags.string({
			char: 'm',
			description: 'Sitemap file (accepts file path or URL)',
			required: false,
			default: 'public/sitemap.xml',
		}),
		asynchronous: Flags.boolean({
			char: 'a',
			description: 'Execute all tests asynchronously at once (around 5x faster, but might cause problems)',
			required: false,
			default: false,
		}),
	}

	async run(): Promise<void> {
		const ctx: Ctx = await this.parseConfig()

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
						// {
						// 	title: 'Compile list of pages',
						// 	task: async (): Promise<void> => {
						// 		const pages = this.getListOfPages(ctx)
						// 	}
						// },
					]
				)
			},
			{
				title: 'Shutting down',
				task: async (ctx, task) => task.newListr(() => [
					{
						title: 'Closing browser',
						task: async (ctx) => {
							await ctx.teardown!()
						}
					}
				])
			}
		]

		await new Listr<Ctx>(tasks, { ctx }).run()
	}

	async catch(error: Error) {
		// this.error(error as Error)
		throw error
	}


	async readSwupConfig(filename: string): Promise<ConfigFile> {
		const path = join(process.cwd(), filename)
		try {
			const config = await import(path)
			if (typeof config !== 'object') {
				throw new Error('Not a valid object')
			}
			return config
		} catch (error) {
			throw new Error(`Error reading swup config file: ${error}`)
		}
	}

	async parseConfig(): Promise<Config> {
		const { flags } = await this.parse(Validate)
		const userConfig = await this.readSwupConfig(flags.config)
		return {
			animationSelector: flags.animationSelector,
			containers: flags.containers.split(','),
			stylesExpectedToChange: flags.stylesExpectedToChange.split(','),
			sitemap: flags.sitemap,
			asynchronous: flags.asynchronous,
			baseUrl: flags.baseUrl,
			runTests: flags.runTests,
			testUrl: flags.testUrl,
			...userConfig.swup,
			...userConfig.validate
		}
	}

	async getPagesToTest(ctx: Ctx): Promise<{ urls: string[], source: string }> {
		let source = ''
		let urls: string[] = []
		if (ctx.testUrl) {
			source = 'single url argument'
			urls = [ctx.testUrl]
		} else if (ctx.baseUrl) {
			source = 'crawled site urls'
			urls = await this.getPageUrlsFromCrawler(ctx)
		} else if (ctx.sitemap) {
			source = `parsed sitemap ${ctx.sitemap}`
			urls = await this.getPageUrlsFromSitemap(ctx)
		}
		return { urls, source }
	}

	getPageUrlsFromCrawler(ctx: Ctx): Promise<string[]> {
		if (!ctx.baseUrl) return Promise.resolve([])

		const urls: string[] = []
		const { origin } = new URL(ctx.baseUrl)
		return new Promise((resolve) => {
			const crawler = new Crawler({
				maxConnections: 10,
				skipDuplicates: true,
				// @ts-ignore
				callback: function (error, res, done) {
					if (error) {
						console.warn(error)
					}
					if (!res.$) {
						done()
						return
					}
					urls.push(res.request.uri.href)
					const $ = res.$
					$('a[href]').each(function () {
						// @ts-ignore
						const href = $(this).attr('href')
						if (!href) {
							done()
							return false
						}

						if (!new RegExp('.(gif|jpg|png|bmp|jpeg|pdf)$', 'i').test(href)) {
							if (href.startsWith('http')) {
								if (href.startsWith(origin)) {
									crawler.queue(href)
								}
							} else if (href.startsWith('/')) {
								crawler.queue(new URL(`${origin}${href}`).href)
							}
						}
					})

					setTimeout(done) // I guess jQuery dom reading is slow?
				},
			})

			crawler.queue(ctx.baseUrl)
			crawler.on('drain', () => resolve(urls))
		})
	}

	async getPageUrlsFromSitemap(ctx: Ctx): Promise<string[]> {
		if (!ctx.baseUrl) return Promise.resolve([])

		let sitemap
		if (isUrl(ctx.sitemap)) {
			try {
				sitemap = await (fetch(ctx.sitemap).then(res => res.text()))
			} catch (error) {
				throw new Error(`Error fetching sitemap: ${error}`)
			}
		} else {
			try {
				sitemap = await fs.readFile(join(process.cwd(), ctx.sitemap), 'utf8')
			} catch (error) {
				throw new Error(`Error reading sitemap: ${error}`)
			}
		}

		// return (JSON.parse(parser.toJson(sitemap)).urlset.url.map(i => i.loc))
		return []
	}
}
