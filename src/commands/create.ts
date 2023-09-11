import * as fs from 'fs/promises'
import * as path from 'path'
import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import { Listr } from 'listr2'
import { rimraf } from 'rimraf'
import { kebabCase, startCase, upperFirst } from 'lodash-es'

import { cloneRepo, fileExists, pascalCase } from '../util.js'

enum Type {
	plugin = 'plugin',
	theme = 'theme'
}

interface Names {
	upper: string
	pascal: string
	title: string
	kebab: string
	short: string
	full: string
}


interface Ctx {
	type: Type
	dir: string
	path: string
	names: Names
	repo?: string
}

export default class Create extends Command {
	static summary = 'Create a swup plugin or theme'
	static description = 'Generate a new swup plugin or theme from an official, best-practice template'
	static examples = [
		`<%= config.bin %> <%= command.id %> --name SwupExamplePlugin`,
		`<%= config.bin %> <%= command.id %> --name SwupExampleTheme --type theme`,
	]
	static flags = {
		name: Flags.string({
			summary: 'Plugin name',
			description: 'Name of the plugin as used in code and readme, e.g. Swup[YourName]Plugin',
			required: true,
			char: 'n',
		}),
		repo: Flags.string({
			summary: 'Repository URL',
			description: 'Link to a public Git repository of the new plugin',
			char: 'r',
		}),
		type: Flags.string({
			summary: 'Type of plugin to create',
			description: 'Choose between creating a plugin or a theme',
			options: ['plugin', 'theme'],
			default: 'plugin',
			char: 't',
		}),
	}

	templateRepos: Record<keyof typeof Type, string> = {
		plugin: 'swup/plugin-template',
		theme: 'swup/theme-template'
	}

	async run(): Promise<void> {
		const { flags } = await this.parse(Create)
		const type = Type[flags.type as keyof typeof Type]
		const name = flags.name.replace(/^swup/i, '').replace(/(plugin|theme)$/i, '').trim()
		const names: Names = {
			upper: upperFirst(name),
			pascal: pascalCase(name),
			kebab: kebabCase(name),
			title: startCase(name),
			short: `${pascalCase(name)}${upperFirst(type)}`,
			full: `Swup${pascalCase(name)}${upperFirst(type)}`,
		}
		const ctx: Ctx = {
			type,
			names,
			dir: names.full,
			path: path.join(process.cwd(), names.full),
			repo: flags.repo
		}

		const tasks = [
			{ title: 'Creating directory', task: this.createDirectory },
			{ title: 'Cloning repository', task: this.cloneRepository },
			{ title: 'Clearning git directory', task: this.clearGitDirectory },
			{ title: 'Updating package.json', task: this.updatePackageJson },
			{ title: 'Updating plugin file', task: this.updatePluginFile },
			{ title: 'Updating readme', task: this.updateReadme },
		]

		try {
			this.log(chalk`Creating {magenta ${type}} with name {green ${names.full}}...`)
			await new Listr<Ctx>(tasks, { ctx, concurrent: false }).run()
			this.log(chalk`Created {green ${names.full}}`)
		} catch (error) {
			this.error(`${error}`)
		}
	}

	async createDirectory(ctx: Ctx): Promise<void> {
		if (await fileExists(ctx.path)) {
			throw new Error(`Directory ${ctx.dir} already exists.`)
		}
		try {
			await fs.mkdir(ctx.path)
		} catch (error) {
			throw new Error(`Error creating directory ${ctx.dir}: ${error}`)
		}
	}

	async clearDirectory(ctx: Ctx): Promise<void> {
		if (!ctx.path) return
		await rimraf(ctx.path)
	}

	async clearGitDirectory(ctx: Ctx): Promise<void> {
		if (!ctx.path) return
		await rimraf(`${ctx.path}/.git`)
	}

	async cloneRepository(ctx: Ctx): Promise<void> {
		const repo = this.templateRepos[ctx.type]
		try {
			await cloneRepo(`https://github.com/${repo}.git`, ctx.path)
		} catch (error) {
			this.clearDirectory(ctx)
			throw new Error(`Error cloning repository ${repo}: ${error}`)
		}
	}

	async updatePluginFile({ path, names }: { path: string, names: Names }) {
		const pluginPath = `${path}/src/index.js`
		try {
			let data = await fs.readFile(pluginPath, 'utf8')
			data = data.replace(/PluginName/g, names.short)
			data = data.replace(/ThemeName/g, names.short)
			await fs.writeFile(pluginPath, data)
		} catch (error) {
			throw new Error(`Error updating plugin file: ${error}`)
		}
	}

	async updatePackageJson({ path, names, repo }: { path: string, names: Names, repo?: string }): Promise<void> {
		const packagePath = `${path}/package.json`
		let pckg: any
		try {
			pckg = JSON.parse(await fs.readFile(packagePath, 'utf8'))
		} catch (error) {
			throw new Error(`Error reading package.json: ${error}`)
		}

		pckg.name = names.kebab
		pckg.version = '0.0.0'
		pckg.description = ''
		pckg.author.name = ''
		pckg.author.email = ''
		pckg.author.url = ''
		if (repo) {
			pckg.repository.url = repo
		} else {
			delete pckg.repository
		}

		try {
			await fs.writeFile(packagePath, JSON.stringify(pckg, null, 2))
		} catch (error) {
			throw new Error(`Error updating package.json: ${error}`)
		}
	}

	async updateReadme({ path, names }: { path: string, names: Names }): Promise<void> {
		const readmePath = `${path}/readme.md`
		try {
			let data = await fs.readFile(readmePath, 'utf8')
			data = data.replace(/ *\[comment\]: CLI-remove-start[\s\S]*\[comment\]: CLI-remove-end */g, '')
			data = data.replace(/swup-\[(plugin-name|theme-name)\]-plugin/g, names.kebab)
			data = data.replace(/ \[(Plugin Name|Theme Name)\]/g, names.title)
			data = data.replace(/\[(PluginName|ThemeName)\]/g, names.pascal)
			data = data.replace(/(SwupNamePlugin|SwupNameTheme)/g, names.full)
			await fs.writeFile(readmePath, data)
		} catch (error) {
			throw new Error(`Error updating readme: ${error}`)
		}
	}
}
