import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { Listr } from 'listr2';

import { exec } from '../../shell.js';
import { checkPluginPackageInfo, loadPackageInfo } from '../../package.js';

interface Ctx {
	pckg?: { name?: string };
}

export default class Build extends Command {
	static summary = 'Build package';
	static description = 'Build package code for distribution using microbundle';
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
		const { flags } = await this.parse(Build);

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
						task.title = chalk`Bundle package {magenta ${ctx.pckg?.name}}`;
						return task.newListr(() => [
							{
								title: 'Create module bundle',
								async task() {
									exec(
										'BROWSERSLIST_ENV=modern npx microbundle -f modern,esm,cjs --css inline'
									);
								}
							},
							{
								title: 'Create standalone bundle',
								async task() {
									exec(
										'BROWSERSLIST_ENV=production npx microbundle -f umd --css inline --external none --define process.env.NODE_ENV=production'
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
