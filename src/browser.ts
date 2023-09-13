import { URL } from 'url'

import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
import Crawler from 'crawler'

import { isAssetUrl, isHtmlContentType, isLocalUrl, isValidUrl, removeHash, wait } from './util.js'

type Styles = Record<string, string>[]

export async function createBrowser(): Promise<{ browser: Browser, teardown: () => Promise<void> }> {
	const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
	const teardown = async () => await browser.close()
	return { browser, teardown }
}

export async function visitPage(browser: Browser, url: string) {
	const page = await browser.newPage()
	await page.goto(url)
	return page
}

export async function countElementsOnPage(page: Page, selector: string) {
	return await page.evaluate((selector) => document.querySelectorAll(selector).length, selector)
}

export async function getNumberOfContainers(page: Page, selectors: string[]) {
	return await countElementsOnPage(page, selectors.join(', '))
}

export async function validateNumberOfContainers(page: Page, url: string, expected: number, containers: string[]) {
	const received = await getNumberOfContainers(page, containers)
	if (received !== expected) {
		return {
			text: 'Incorrect number of containers',
			expected,
			received,
			page: url
		}
	}
}

export async function getStyleProperty(page: Page, selector: string, property: string): Promise<Styles> {
	return await page.evaluate(({ selector, property }) => {
		const elements = Array.from(document.querySelectorAll(selector))
		return elements.map((el) => {
			const style = window.getComputedStyle(el)
			return { [property]: style.getPropertyValue(property) }
		})
	}, { selector, property })
}

async function getStyleProperties(page: Page, selector: string, properties: string[]): Promise<Styles[]> {
	return await Promise.all(properties.map(prop => getStyleProperty(page, selector, prop)))
}

async function addAnimatingClass(page: Page) {
	await page.evaluate(() => {
		document.documentElement.classList.add('is-animating')
	})
}

export async function validateTransitionDuration(page: Page, selector: string) {
	const transitionDurations = await getStyleProperty(page, selector, 'transition-duration')
	const missingDurations = transitionDurations
		.map(style => parseFloat(style['transition-duration']))
		.filter(duration => !duration)
	if (missingDurations.length) {
		throw new Error(`Missing transition duration on element: ${selector}`)
	}
}

export async function validateTransitionStyles(page: Page, selector: string, changedStyles: string[]) {
	const duration = await getStyleProperty(page, selector, 'transition-duration')
	const stylesBefore = await getStyleProperties(page, selector, changedStyles)
	await addAnimatingClass(page)
	await wait(1000)
	const stylesAfter = await getStyleProperties(page, selector, changedStyles)
	const styles = mergeStyles(duration, stylesBefore, stylesAfter)

	for (const element of styles) {
		const changed = Object.keys(element.before).map(key => element.before[key] !== element.after[key])
		const atLeastOneChanged = changed.reduce((c, a) => a || c, false)
		if (!atLeastOneChanged) {
			throw new Error(`Missing expected style change on element: ${selector} (${changedStyles.join(', ')})`)
		}
	}
}

function mergeStyles(transitionDuration: Styles, before: Styles[], after: Styles[]) {
	return transitionDuration.map((item, index) => {
		return {
			...item,
			before: {
				...before.map((item) => ({...item[index]})).reduce((c, a) => ({ ...a, ...c })),
			},
			after: {
				...after.map((item) => ({...item[index]})).reduce((c, a) => ({ ...a, ...c })),
			}
		}
	})
}

export function crawlSiteForUrls(url: string): Promise<string[]> {
	const base = new URL(url)
	const urls: string[] = []

	const options: Crawler.CreateCrawlerOptions = {
		maxConnections: 10,
		skipDuplicates: true
	}

	return new Promise((resolve) => {
		const crawler = new Crawler({
			...options,
			callback: (error, { request, headers, $ }, done) => {
				if (error) {
					console.error(error)
					return done()
				}
				if (!isHtmlContentType(headers)) {
					return done()
				}
				urls.push(request.uri.href)
				$('a[href]:not([download])').each((i, el) => {
					const href = removeHash(String($(el).attr('href')).trim())
					const url = new URL(href, base)
					if (isValidUrl(url)) {
						if (!urls.includes(url.href) && isLocalUrl(url, base) && !isAssetUrl(url)) {
							crawler.queue(url.href)
						}
					}
				})
				setTimeout(done, 5)
			},
		})
		crawler.on('drain', () => resolve(urls))
		crawler.queue(base.href)
	})
}
