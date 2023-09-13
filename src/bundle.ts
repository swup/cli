import { readFile } from 'node:fs/promises'

import { resolve } from './resolve.js'
import { JSONValue } from './types.js'

export function checkPluginPackageInfo(data?: JSONValue): { errors: string[] } {
	const errors = []
	const pckg = data as any

	if (!pckg || typeof pckg !== 'object') {
		errors.push('Not a valid package.json')
		return { errors }
	}
	if (!pckg.amdName) {
		errors.push('package.json missing `amdName` property')
	}
	if (pckg.type !== 'module') {
		errors.push('package.json `type` property must be "module"')
	}
	if (!pckg.source) {
		errors.push('package.json missing `source` property')
	}
	if (!pckg.main) {
		errors.push('package.json missing `main` property')
	}
	if (!pckg.module) {
		errors.push('package.json missing `module` property')
	}
	if (!pckg.unpkg) {
		errors.push('package.json missing `unpkg` property')
	}
	if (!pckg.exports) {
		errors.push('package.json missing `exports` property')
	}
	if (!pckg.browserslist) {
		errors.push('package.json missing `browserslist` property')
	}

	return { errors }
}

export async function loadPackageInfo(): Promise<JSONValue> {
	try {
		const importPath = new URL(resolve('package.json'), import.meta.url)
		return JSON.parse(await readFile(importPath, { encoding: 'utf8' }))
	} catch (error) {
		throw new Error(`Error loading package.json: ${error}`)
	}
}
