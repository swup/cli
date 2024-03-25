import { Command } from '@oclif/core';
import { Listr } from 'listr2';

import { exec } from '../../shell.js';

export default class Lint extends Command {
	static summary = 'Format package';
	static description = 'Fix code formatting issues using prettier';
	static examples = ['<%= config.bin %> <%= command.id %>'];

	async run(): Promise<void> {
		await new Listr([
			{
				title: 'Format package',
				task() {
					if (exec(`npx prettier '**/*.{js,ts,mjs,cjs,css,md}' --write`)) {
						throw new Error('Error formatting code');
					}
				}
			}
		]).run();
	}
}
