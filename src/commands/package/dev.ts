import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { Listr } from 'listr2';

import { exec } from '../../shell.js';
import { checkPluginPackageInfo, loadPackageInfo } from '../../package.js';

interface Ctx {
	pckg?: { name?: string };
}

export default class Dev extends Command {
	static summary = 'Develop package';
	static description =
		'Build package code for development using microbundle and watch for changes';

	static examples = ['<%= config.bin %> <%= command.id %>'];

	static flags = {
		check: Flags.boolean({
			summary: 'Check package info',
			description:
				'Check for required package.json fields before bundling. Disable using --no-check.',
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
					async task(ctx) {
						ctx.pckg = await loadPackageInfo();
					}
				},
				{
					title: 'Check package info',
					enabled: () => flags.check,
					async task(ctx) {
						const { errors } = checkPluginPackageInfo(ctx.pckg);
						if (errors?.length) {
							throw new Error(errors.join('\n'));
						}
					}
				},
				{
					title: 'Bundle package',
					async task(ctx, task) {
						task.title = chalk`Bundle package {magenta ${ctx.pckg?.name}} and watch for changes`;
						return task.newListr(() => [
							{
								title: 'Start watch mode',
								async task() {
									exec(
										'BROWSERSLIST_ENV=development npx microbundle -f modern --css inline -w'
									);
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
