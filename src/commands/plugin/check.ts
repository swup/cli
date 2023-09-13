import { Command } from '@oclif/core'
import { Listr } from 'listr2'

import { JSONValue } from '../../types.js'
import { checkPluginPackageInfo, loadPackageInfo } from '../../bundle.js'

interface Ctx {
	pckg?: JSONValue
}

export default class Check extends Command {
	static summary = 'Check plugin package info'
	static description = 'Ensure a plugin package.json is valid'
	static examples = ['<%= config.bin %> <%= command.id %>']

	async run(): Promise<void> {
		const ctx: Ctx = {}
		await new Listr([
			{
				title: 'Load package info',
				task: async() => {
					ctx.pckg = await loadPackageInfo()
				}
			},
			{
				title: 'Check package info',
				task: async(ctx) => {
					const { errors } = checkPluginPackageInfo(ctx.pckg)
					if (errors?.length) {
						throw new Error(errors.join('\n'))
					}
				}
			}
		], { ctx }).run()
	}
}
