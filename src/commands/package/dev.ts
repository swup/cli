import { Command, Flags } from '@oclif/core';
import template from 'chalk-template';
import { Listr } from 'listr2';

import { bundlePackage } from '../../bundle.js';
import { checkPluginPackageInfo, loadPackageInfo } from '../../package.js';

interface Ctx {
	pckg?: unknown;
}

export default class Dev extends Command {
	static summary = 'Develop package';
	static description = 'Build package code for development using tsdown and watch for changes';
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
						// @ts-ignore: ctx.pckg is typed as unknown
						task.title = template`Bundle package {magenta ${ctx.pckg?.name}} and watch for changes`;
						await bundlePackage(ctx.pckg, { watch: true });
					}
				}
			],
			{ ctx }
		).run();
	}
}
