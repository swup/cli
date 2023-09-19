import { Command } from '@oclif/core';
import { Listr } from 'listr2';

import { exec } from '../../shell.js';

export default class Lint extends Command {
	static summary = 'Lint package';
	static description = 'Check code for formatting issues using prettier';
	static examples = ['<%= config.bin %> <%= command.id %>'];

	async run(): Promise<void> {
		await new Listr([{
			title: 'Lint package',
			task: () => {
				if (exec(`npx prettier 'src/**/*.{js,ts,mjs}' --check`)) {
					throw new Error('Code has formatting issues');
				}
			}
		}]).run();
	}
}
