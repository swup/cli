import { URL } from 'url';

import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import Crawler from 'crawler';
import chalk from 'chalk';

import {
	getLocalUrl,
	isAssetUrl,
	isHtmlContentType,
	isLocalUrl,
	isValidUrl,
	removeHash,
	wait
} from './util.js';

type Styles = Record<string, string>;

export async function createBrowser(): Promise<{
	browser: Browser;
	teardown: () => Promise<void>;
}> {
	const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
	const teardown = async () => await browser.close();
	return { browser, teardown };
}

export async function visitPage(browser: Browser, url: string) {
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: 'domcontentloaded' });
	return page;
}

export async function elementExists(page: Page, selector: string): Promise<boolean> {
	return await page.evaluate((selector) => !!document.querySelector(selector), selector);
}

export async function countElementsOnPage(page: Page, selector: string): Promise<number> {
	return await page.evaluate((selector) => document.querySelectorAll(selector).length, selector);
}

export async function getNumberOfContainers(page: Page, selectors: string[]): Promise<number> {
	return await countElementsOnPage(page, selectors.join(', '));
}

export async function validateNumberOfContainers(
	page: Page,
	url: string,
	expected: number,
	containers: string[]
) {
	const received = await getNumberOfContainers(page, containers);
	if (received !== expected) {
		return {
			text: 'Incorrect number of containers',
			expected,
			received,
			page: url
		};
	}
}

export async function getStyleProperty(
	page: Page,
	selector: string,
	property: string
): Promise<string> {
	return await page.evaluate(
		({ selector, property }) => {
			const element = document.querySelector(selector);
			return element ? window.getComputedStyle(element).getPropertyValue(property) : '';
		},
		{ selector, property }
	);
}

async function getStyleProperties(
	page: Page,
	selector: string,
	properties: string[]
): Promise<Styles> {
	const styles: Styles = {};
	for (const prop of properties) {
		const style = await getStyleProperty(page, selector, prop);
		if (style) {
			styles[prop] = style;
		}
	}
	return styles;
}

async function addChangingClass(page: Page) {
	await page.evaluate(() => document.documentElement.classList.add('is-changing'));
}

async function removeChangingClass(page: Page) {
	await page.evaluate(() => document.documentElement.classList.remove('is-changing'));
}

async function addAnimatingClass(page: Page) {
	await page.evaluate(() => document.documentElement.classList.add('is-animating'));
}

export async function getAnimationDuration(page: Page, selector: string): Promise<number> {
	const transition = parseFloat(await getStyleProperty(page, selector, 'transition-duration'));
	const animation = parseFloat(await getStyleProperty(page, selector, 'animation-duration'));
	const duration = Math.max(transition, animation);
	return duration;
}

export async function validateAnimationDuration(page: Page, selector: string) {
	await addChangingClass(page);
	const duration = getAnimationDuration(page, selector);
	await removeChangingClass(page);
	if (!duration) {
		throw new Error(`Missing animation duration on element: ${selector}`);
	}
}

export async function validateAnimationStyles(page: Page, selector: string, styles: string[]) {
	const exists = await elementExists(page, selector);
	if (!exists) {
		throw new Error(`Element not found: ${selector}`);
	}

	await addChangingClass(page);
	const duration = await getAnimationDuration(page, selector);
	const before = await getStyleProperties(page, selector, styles);
	await addAnimatingClass(page);
	await wait(duration + 100);
	const after = await getStyleProperties(page, selector, styles);
	await removeChangingClass(page);

	if (!Object.keys(before).length && !Object.keys(after).length) {
		throw new Error(`Styles not found on element: ${selector} (${styles.join(', ')})`);
	}

	for (const prop of Object.keys(before)) {
		if (before[prop] === after[prop]) {
			throw new Error(`Styles not changed on element: ${selector} (${prop})`);
		}
	}
}

export function crawlSiteForUrls(url: string): Promise<string[]> {
	const base = new URL(url);
	const urls: string[] = [];

	const options: Crawler.CreateCrawlerOptions = {
		maxConnections: 10,
		skipDuplicates: true
	};

	return new Promise((resolve) => {
		const crawler = new Crawler({
			...options,
			callback: (error, { request, statusCode, headers, $ }, done) => {
				if (error) {
					console.error(error);
					return done();
				}
				if (statusCode < 200 || statusCode >= 400) {
					console.warn(
						chalk`{yellow ⚠} Received status {yellow ${statusCode}} {dim on} ${getLocalUrl(request.uri.href)}`
					);
					return done();
				}
				if (!isHtmlContentType(headers)) {
					return done();
				}
				urls.push(request.uri.href);
				$('a[href]:not([download])').each((i, el) => {
					const href = removeHash(String($(el).attr('href')).trim());
					const url = new URL(href, base);
					if (isValidUrl(url)) {
						if (!urls.includes(url.href) && isLocalUrl(url, base) && !isAssetUrl(url)) {
							crawler.queue(url.href);
						}
					}
				});
				setTimeout(done, 5);
			}
		});
		crawler.on('drain', () => resolve(urls));
		crawler.queue(base.href);
	});
}
