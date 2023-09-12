import * as fs from 'fs/promises'
import { camelCase, upperFirst } from 'lodash-es'

export function wait(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms))
}

export function pascalCase(str: string): string {
	return upperFirst(camelCase(str))
}

export function isUrl(str: string): boolean {
	return /^https?:\/\//.test(str)
}

export async function fileExists(path: string): Promise<boolean> {
	try {
		await fs.access(path)
		return true
	} catch (error) {
		return false
	}
}

export async function isDirectory(path: string): Promise<boolean> {
	try {
		return (await fs.lstat(path)).isDirectory()
	} catch (error) {
		return false
	}
}

export async function isEmptyDirectory(path: string): Promise<boolean> {
	try {
		const directory = await fs.opendir(path)
		const entry = await directory.read()
		await directory.close()
		return entry === null
	} catch (error) {
		return false
	}
}
