import * as path from 'path'
import * as fs from 'fs'

const appDirectory = fs.realpathSync(process.cwd())

export function resolve(relativePath = '') {
	if (relativePath) {
		return path.resolve(appDirectory, relativePath)
	} else {
		return appDirectory
	}
}
