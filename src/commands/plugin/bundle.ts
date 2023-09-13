import { Command } from '@oclif/core'
import chalk from 'chalk'
import { Listr } from 'listr2'

import { JSONValue } from '../../types.js'
import { checkPluginPackageInfo, loadPackageInfo } from '../../bundle.js'

interface Ctx {
	pckg?: JSONValue
}

export default class Bundle extends Command {
	static summary = 'Bundle a plugin'
	static description = 'Bundle a plugin for distribution using microbundle'
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
			},
			{
				title: 'Bundle plugin',
				task: async(ctx) => {
					const { errors } = checkPluginPackageInfo(ctx.pckg)
					if (errors?.length) {
						throw new Error(errors.join('\n'))
					}
				}
			}
		], { ctx }).run()
	}

	async catch(error: Error) {
		// this.error(error as Error)
		throw error
	}
}
