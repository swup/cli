import * as path from 'node:path';
import * as fs from 'node:fs';

const appDirectory = fs.realpathSync(process.cwd());

export function resolve(relativePath = '') {
	if (relativePath) {
		return path.resolve(appDirectory, relativePath);
	}

	return appDirectory;
}
