import { Command } from '@oclif/core'

export default class Bundle extends Command {
	static summary = 'Bundle a swup plugin'
	static description = 'Bundle a plugin for distribution using microbundle'
	static examples = [
		`<%= config.bin %> <%= command.id %>`
	]

	async run(): Promise<void> {
		this.log(`Bundling plugin`)
	}

	async catch(error: Error) {
		// this.error(error as Error)
		throw error
	}
}
