import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { Listr } from 'listr2';

import { exec } from '../../shell.js';
import { checkPluginPackageInfo, loadPackageInfo } from '../../package.js';

interface Ctx {
	pckg?: unknown;
}

export default class Dev extends Command {
	static summary = 'Develop plugin';
	static description = 'Bundle plugin code for development and watch for changes';
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
		const { flags } = await this.parse(Dev);

		const ctx: Ctx = {};
		await new Listr(
			[
				{
					title: 'Load package info',
					task: async (ctx) => {
						ctx.pckg = await loadPackageInfo();
					}
				},
				{
					title: 'Check package info',
					enabled: () => flags.check,
					task: async (ctx) => {
						const { errors } = checkPluginPackageInfo(ctx.pckg);
						if (errors?.length) {
							throw new Error(errors.join('\n'));
						}
					}
				},
				{
					title: 'Develop plugin',
					task: async (ctx, task) => {
						// @ts-ignore
						task.title = chalk`Bundle plugin {magenta ${ctx.pckg?.name}} and watch for changes`;
						return task.newListr(() => [
							{
								title: 'Start watch mode',
								task: async () => {
									exec('BROWSERSLIST_ENV=development npx microbundle -f modern --css inline -w');
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
