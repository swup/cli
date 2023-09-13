import { Command } from '@oclif/core';

import { exec } from '../../shell.js';

export default class Lint extends Command {
	static summary = 'Lint a plugin';
	static description = 'Check plugin code for formatting issues';
	static examples = ['<%= config.bin %> <%= command.id %>'];

	async run(): Promise<void> {
		this.log('Linting plugin...');
		exec(`npx prettier 'src/**/*.{js,ts,mjs}' --check`);
	}
}
