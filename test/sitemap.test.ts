import { mkdtemp, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect } from 'chai';

import { readSitemapUrls } from '../src/util.js';

describe('readSitemapUrls', () => {
	let server: Server;
	let base: string;

	before(async () => {
		server = createServer((req, res) => {
			res.setHeader('content-type', 'application/xml');
			if (req.url === '/index.xml') {
				res.end(`<sitemapindex><sitemap><loc>${base}/pages.xml</loc></sitemap></sitemapindex>`);
			} else {
				res.end(`<urlset><url><loc>${base}/a</loc></url><url><loc>${base}/b</loc></url></urlset>`);
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
		expect(await readSitemapUrls(`${base}/index.xml`)).to.deep.equal([`${base}/a`, `${base}/b`]);
	});
});
