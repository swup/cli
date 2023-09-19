import { cosmiconfig } from 'cosmiconfig';
import { mergeWith } from 'lodash-es';

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export interface Config {
	swup: {
		animationSelector: string;
		containers: string[];
	};
	validate: {
		url: string;
		crawl: boolean;
		sitemap: string;
		limit: number;
		tests: string[];
		parallel: boolean;
		styles: string[];
	};
}

const moduleName = 'swup';

export const defaults: Config = {
	swup: {
		animationSelector: '[class*="transition-"]',
		containers: ['#swup']
	},
	validate: {
		url: '',
		crawl: false,
		sitemap: '',
		limit: 0,
		tests: ['all'],
		parallel: false,
		styles: ['opacity', 'transform']
	}
};

export async function loadConfig(overrides: DeepPartial<Config> = {}): Promise<Config> {
	let userConfig: DeepPartial<Config> = {};
	try {
		const explorer = cosmiconfig(moduleName);
		const { config = {} } = (await explorer.search()) || {};
		userConfig = config;
	} catch (error) {
		console.error(`Error loading ${moduleName} config: ${error}`);
	}

	// Combine base and local overrides (from CLI args)
	const base = mergeConfig(defaults, overrides);
	// Combine base and user overrides (from config file)
	const config = mergeConfig(base, userConfig);
	return config;
}

export function mergeConfig<T extends object>(destination: T, source: DeepPartial<T>): T {
	return mergeWith({}, destination, source, (value, src) => {
		if (Array.isArray(value) && Array.isArray(src)) {
			return src;
		}
	});
}
