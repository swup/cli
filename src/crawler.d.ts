// Minimal type declarations for crawler v2, which ships no types of its own.
// Only the surface area used by this CLI is declared.
declare module 'crawler' {
	import { EventEmitter } from 'node:events';

	interface CheerioLike {
		each(fn: (index: number, element: unknown) => void): CheerioLike;
		attr(name: string): string | undefined;
	}

	type CheerioRoot = (selector: unknown) => CheerioLike;

	interface CrawlerResponse {
		statusCode: number;
		headers: Record<string, string>;
		body: Buffer;
		options: { url?: string };
		$: CheerioRoot;
	}

	interface CrawlerOptions {
		maxConnections?: number;
		skipDuplicates?: boolean;
		callback?: (error: unknown, response: CrawlerResponse, done: () => void) => void;
	}

	export default class Crawler extends EventEmitter {
		constructor(options?: CrawlerOptions);
		add(url: string | string[]): void;
		queue(url: string | string[]): void;
		send(url: string): Promise<CrawlerResponse>;
	}
}
