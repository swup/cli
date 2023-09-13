import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { Listr } from 'listr2';

import { exec } from '../../shell.js';
import { JSONValue } from '../../types.js';
import { checkPluginPackageInfo, loadPackageInfo } from '../../package.js';

interface Ctx {
	pckg?: JSONValue;
}

export default class Bundle extends Command {
	static summary = 'Bundle a plugin';
	static description = 'Bundle a plugin for distribution using microbundle';
	static examples = ['<%= config.bin %> <%= command.id %>'];

	static flags = {
		check: Flags.boolean({
			summary: 'Check package info',
			description: 'Check for required package.json fields before bundling. Disable using --no-check.',
			required: false,
			default: true,
			allowNo: true
		})
	};

	async run(): Promise<void> {
		const { flags } = await this.parse(Bundle);

		const ctx: Ctx = {};
		await new Listr(
			[
				{
					title: 'Check package info',
					enabled: () => flags.check,
					task: async (ctx) => {
						ctx.pckg = await loadPackageInfo();
						const { errors } = checkPluginPackageInfo(ctx.pckg);
						if (errors?.length) {
							throw new Error(errors.join('\n'));
						}
					}
				},
				{
					title: 'Bundle plugin',
					task: async (ctx, task) => {
						return task.newListr(() => [
							{
								title: 'Create module bundle',
								task: async () => {
									exec('BROWSERSLIST_ENV=modern npx microbundle -f modern,esm,cjs --css inline');
								}
							},
							{
								title: 'Create standalone bundle',
								task: async () => {
									exec('BROWSERSLIST_ENV=production npx microbundle -f umd --css inline --external none --define process.env.NODE_ENV=production');
								}
							}
						]);
					}
				}
			],
			{ ctx }
		).run();
	}
}
