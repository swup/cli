import { mkdtemp, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect } from 'chai';

import Validate from '../src/commands/validate.js';
import { readSitemapUrls } from '../src/util.js';

describe('readSitemapUrls', () => {
	let server: Server;
	let base: string;

	before(async () => {
		server = createServer((req, res) => {
			res.setHeader('content-type', 'application/xml');
			if (req.url === '/missing.xml') {
				res.statusCode = 404;
				res.end('<html>Not found</html>');
			} else if (req.url === '/empty.xml') {
				res.end('<urlset></urlset>');
			} else if (req.url === '/index.xml') {
				res.end(
					`<sitemapindex><sitemap><loc>${base}/pages.xml</loc></sitemap></sitemapindex>`
				);
			} else {
				res.end(
					`<urlset><url><loc>${base}/a</loc></url><url><loc>${base}/b</loc></url></urlset>`
				);
			}
		});
		await new Promise<void>((resolve) => {
			server.listen(0, resolve);
		});
		base = `http://localhost:${(server.address() as AddressInfo).port}`;
	});

	after(() => {
		server.close();
	});

	it('reads a local file by absolute path, decodes entities and CDATA', async () => {
		const file = join(await mkdtemp(join(tmpdir(), 'swup-cli-')), 'sitemap.xml');
		await writeFile(
			file,
			`<?xml version="1.0"?>
			<urlset>
				<url><loc>https://example.com/?a=1&amp;b=2</loc></url>
				<url><loc>
					<![CDATA[https://example.com/cdata]]>
				</loc></url>
				<url><loc>not-a-url</loc></url>
			</urlset>`
		);
		expect(await readSitemapUrls(file)).to.deep.equal([
			'https://example.com/?a=1&b=2',
			'https://example.com/cdata'
		]);
	});

	it('follows sitemap indexes', async () => {
		expect(await readSitemapUrls(`${base}/index.xml`)).to.deep.equal([
			`${base}/a`,
			`${base}/b`
		]);
	});

	it('throws on a non-OK HTTP status', async () => {
		const error = await readSitemapUrls(`${base}/missing.xml`).catch((error) => error);
		expect(error).to.be.instanceOf(Error);
		expect(error.message).to.contain('HTTP 404');
	});

	it('makes validate fail if the sitemap has no pages', async () => {
		const ctx = { config: { validate: { sitemap: `${base}/empty.xml` } } };
		const error = await Validate.prototype.getPageUrls
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.call({} as any, ctx as any)
			.catch((error: Error) => error);
		expect(error).to.be.instanceOf(Error);
		expect((error as Error).message).to.contain('No pages found');
	});
});
