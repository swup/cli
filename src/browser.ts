import { URL } from 'node:url';

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
	const teardown = async () => browser.close();
	return { browser, teardown };
}

export async function visitPage(browser: Browser, url: string) {
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: 'domcontentloaded' });
	return page;
}

export async function elementExists(page: Page, selector: string): Promise<boolean> {
	return page.evaluate((selector) => Boolean(document.querySelector(selector)), selector);
}

export async function countElementsOnPage(page: Page, selector: string): Promise<number> {
	return page.evaluate((selector) => document.querySelectorAll(selector).length, selector);
}

export async function validateContainers(page: Page, containers: string[]) {
	for (const selector of containers) {
		// eslint-disable-next-line no-await-in-loop
		const count = await countElementsOnPage(page, selector);
		if (count !== 1) {
			throw new Error(`Expected exactly one container ${selector}, found ${count}`);
		}
	}
}

export async function getStyleProperty(
	page: Page,
	selector: string,
	property: string
): Promise<string> {
	return page.evaluate(
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
	const values = await Promise.all(
		properties.map((prop) => getStyleProperty(page, selector, prop))
	);
	const entries = properties.map((prop, i) => [prop, values[i]]);
	return Object.fromEntries(entries.filter(([, value]) => value));
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

/**
 * Get the animation duration of an element in milliseconds.
 * Computed styles always report durations in seconds (e.g. `0.3s`).
 * @param page The page to evaluate
 * @param selector The animated element
 * @returns The longer of transition and animation duration
 */
export async function getAnimationDuration(page: Page, selector: string): Promise<number> {
	const transition = Number.parseFloat(
		await getStyleProperty(page, selector, 'transition-duration')
	);
	const animation = Number.parseFloat(
		await getStyleProperty(page, selector, 'animation-duration')
	);
	const duration = Math.max(transition, animation);
	return duration * 1000;
}

export async function validateAnimationDuration(page: Page, selector: string) {
	await addChangingClass(page);
	const duration = await getAnimationDuration(page, selector);
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

	return new Promise((resolve) => {
		const crawler = new Crawler({
			maxConnections: 10,
			skipDuplicates: true,
			callback(error, { url: href, statusCode, headers, $ }, release) {
				const done = release as () => void;
				if (error) {
					console.error(error);
					return done();
				}

				if (statusCode < 200 || statusCode >= 400) {
					console.warn(
						chalk`{yellow !} Received status {yellow ${statusCode}} {dim on} ${getLocalUrl(
							href
						)}`
					);
					return done();
				}

				if (!isHtmlContentType(headers)) {
					return done();
				}

				urls.push(href);
				$('a[href]:not([download])').each((_: number, el: unknown) => {
					const href = removeHash(String($(el).attr('href')).trim());
					const url = new URL(href, base);
					if (
						isValidUrl(url) &&
						!urls.includes(url.href) &&
						isLocalUrl(url, base) &&
						!isAssetUrl(url)
					) {
						crawler.queue(url.href);
					}
				});
				setTimeout(done, 5);
			}
		});
		crawler.on('drain', () => resolve(urls));
		crawler.queue(base.href);
	});
}
