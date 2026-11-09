import { Command } from '@oclif/core';
import { Listr } from 'listr2';

import { checkPluginPackageInfo, loadPackageInfo } from '../../package.js';

interface Ctx {
	pckg?: unknown;
}

export default class Check extends Command {
	static summary = 'Check package info';
	static description = 'Ensure a bundle package.json is valid';
	static examples = ['<%= config.bin %> <%= command.id %>'];

	async run(): Promise<void> {
		const ctx: Ctx = {};
		await new Listr(
			[
				{
					title: 'Load package info',
					async task() {
						ctx.pckg = await loadPackageInfo();
					}
				},
				{
					title: 'Check package info',
					async task(ctx) {
						const { errors } = checkPluginPackageInfo(ctx.pckg);
						if (errors?.length) {
							throw new Error(errors.join('\n'));
						}
					}
				}
			],
			{ ctx }
		).run();
	}
}
