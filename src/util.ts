import * as fs from 'fs/promises'
import { exec } from 'child_process'
import { camelCase, upperFirst } from 'lodash-es'

export function pascalCase(str: string): string {
	return upperFirst(camelCase(str))
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

export function cloneRepo(repoUrl: string, destination: string): Promise<void> {
	return new Promise((resolve, reject) => {
		exec(`git clone ${repoUrl} ${destination}`, (error, stdout, stderr) => {
			if (error) {
				return reject(new Error(`Failed to clone repo. Error: ${error.message}. Stderr: ${stderr}`))
			}
			resolve()
		})
	})
}
