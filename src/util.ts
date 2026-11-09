import * as fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { URL } from 'node:url';

import { camelCase, upperFirst } from 'lodash-es';

export function wait(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

export function pascalCase(str: string): string {
	return upperFirst(camelCase(str));
}

export function isUrl(str: string): boolean {
	return /^https?:\/\//.test(str);
}

function decodeXmlEntities(str: string): string {
	return str
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&apos;', "'")
		.replaceAll('&amp;', '&');
}

/**
 * Read all page URLs from a sitemap file or URL.
 * Sitemap indexes (e.g. wp-sitemap.xml) are followed recursively.
 * @see https://www.sitemaps.org/protocol.html
 * @param sitemap Local file path or URL
 * @returns All page URLs found
 */
export async function readSitemapUrls(sitemap: string): Promise<string[]> {
	let contents: string;
	if (isUrl(sitemap)) {
		try {
			contents = await fetch(sitemap).then((res) => res.text());
		} catch (error) {
			throw new Error(`Error fetching sitemap: ${error}`);
		}
	} else {
		try {
			contents = await fs.readFile(resolve(process.cwd(), sitemap), 'utf8');
		} catch (error) {
			throw new Error(`Error reading sitemap: ${error}`);
		}
	}

	const locs = [...contents.matchAll(/<loc>\s*(?:<!\[CDATA\[)?(.*?)(?:]]>)?\s*<\/loc>/gs)]
		.map(([, loc]) => decodeXmlEntities(loc.trim()))
		.filter((loc) => isValidUrl(loc));

	if (/<sitemapindex[\s>]/.test(contents)) {
		const nested = await Promise.all(locs.map((loc) => readSitemapUrls(loc)));
		return nested.flat();
	}

	return locs;
}

export async function fileExists(path: string): Promise<boolean> {
	try {
		await fs.access(path);
		return true;
	} catch {
		return false;
	}
}

export async function isDirectory(path: string): Promise<boolean> {
	try {
		const stats = await fs.lstat(path);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

export async function isEmptyDirectory(path: string): Promise<boolean> {
	try {
		const directory = await fs.opendir(path);
		const entry = await directory.read();
		await directory.close();
		return entry === null;
	} catch {
		return false;
	}
}

export function n(n: number, base: string): string {
	return n === 1 ? base : `${base}s`;
}

export function isValidUrl(s: string | URL, protocols: string[] = ['http', 'https']): boolean {
	if (!s) {
		return false;
	}

	try {
		const { protocol } = new URL(String(s));
		if (protocols?.length) {
			return (
				Boolean(protocol) && protocols.map((x) => `${x.toLowerCase()}:`).includes(protocol)
			);
		}

		return true;
	} catch {
		return false;
	}
}

export function isLocalUrl(url: URL, base: URL): boolean {
	return url.origin === base.origin;
}

export function isAssetUrl(url: URL): boolean {
	return Boolean(/\.(jpe?g|a?png|gif|webp|mp4|webm|mov|pdf|docx?|zip|gz)$/i.test(url.pathname));
}

export function isHtmlContentType(headers: Record<string, string>): boolean {
	const contentType = headers['content-type'] || headers['Content-Type'];
	return Boolean(contentType && /\bx?html\b/i.test(contentType));
}

export function removeHash(url: URL | string): string {
	return String(url).replace(/#.*$/, '');
}

export function getLocalUrl(url: URL | string): string {
	const { pathname, search } = new URL(String(url));
	return pathname + search;
}
