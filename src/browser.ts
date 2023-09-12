import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
import { wait } from './util.js'

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

async function validateTransitionDurationStyles(page: Page, url: string, selector: string) {
	const transitionDurations = await getStyleProperty(page, selector, 'transition-duration')
	const missingDurations = transitionDurations
		.map(style => parseFloat(style['transition-duration']))
		.filter(duration => !duration)
	if (missingDurations.length) {
		return {
			text: 'Animated element has transition-duration set to 0s',
			expected: '> 0s',
			received: missingDurations[0],
			page: url,
		}
	}
}

async function validateTransitionStyles(page: Page, url: string, selector: string, changedStyles: string[]) {
	const duration = await getStyleProperty(page, selector, 'transition-duration')
	const stylesBefore = await getStyleProperties(page, selector, changedStyles)
	await addAnimatingClass(page)
	await wait(1000)
	const stylesAfter = await getStyleProperties(page, selector, changedStyles)
	const styles = mergeStyles(duration, stylesBefore, stylesAfter)

	return styles.map(element => {
		const changed = Object.keys(element.before).map(key => element.before[key] !== element.after[key])
		const atLeastOneChanged = changed.reduce((c, a) => a || c, false)

		if (!atLeastOneChanged) {
			return {
				text: 'At least one animated style property must change with class "is-animating"',
				expected: `Not ${JSON.stringify(element.before)}`,
				received: JSON.stringify(element.after),
				page: url,
			}
		}

		return false
	}).filter(i => i)[0]
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
			},
		}
	})
}
