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
