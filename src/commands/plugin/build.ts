import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { Listr } from 'listr2';

import { exec } from '../../shell.js';
import { checkPluginPackageInfo, loadPackageInfo } from '../../package.js';

interface Ctx {
	pckg?: unknown;
}

export default class Build extends Command {
	static summary = 'Build plugin';
	static description = 'Bundle plugin code for distribution using microbundle';
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
		const { flags } = await this.parse(Build);

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
					title: 'Bundle plugin',
					task: async (ctx, task) => {
						// @ts-ignore
						task.title = chalk`Bundle plugin {magenta ${ctx.pckg?.name}}`;
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
