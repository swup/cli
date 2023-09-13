import { Command } from '@oclif/core';

import { exec } from '../../shell.js';

export default class Lint extends Command {
	static summary = 'Format a plugin';
	static description = 'Fix plugin code formatting issues';
	static examples = ['<%= config.bin %> <%= command.id %>'];

	async run(): Promise<void> {
		this.log('Formatting plugin...');
		exec(`npx prettier 'src/**/*.{js,ts,mjs}' --write`);
	}
}
