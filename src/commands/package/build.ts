import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { Listr } from 'listr2';

import { bundlePackage } from '../../bundle.js';
import { checkPluginPackageInfo, loadPackageInfo } from '../../package.js';

interface Ctx {
	pckg?: unknown;
}

export default class Build extends Command {
	static summary = 'Build package';
	static description = 'Build package code for distribution using tsdown';
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
					title: 'Bundle package',
					task: async (ctx, task) => {
						// @ts-ignore
						task.title = chalk`Bundle package {magenta ${ctx.pckg?.name}}`;
						await bundlePackage(ctx.pckg);
					}
				}
			],
			{ ctx }
		).run();
	}
}
