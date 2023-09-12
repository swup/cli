import * as fs from 'fs/promises'
import { join } from 'path'

import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import { Listr } from 'listr2'
import { rimraf } from 'rimraf'
import { kebabCase, startCase, upperFirst } from 'lodash-es'

import { fileExists, isDirectory, isEmptyDirectory, pascalCase } from '../util.js'
import { cloneRepo } from '../repo.js'

enum Type {
	plugin = 'plugin',
	theme = 'theme'
}

interface Names {
	pascal: string
	kebab: string
	title: string
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
		const { flags: { repo, ...flags } } = await this.parse(Create)

		const type = Type[flags.type as keyof typeof Type]
		const names = this.generateNames(flags.name, type)
		const dir = names.kebab
		const path = join(process.cwd(), dir)

		const ctx: Ctx = { type, names, dir, path, repo }

		const tasks = [
			{ title: 'Creating directory', task: this.createDirectory.bind(this) },
			{ title: 'Cloning repository', task: this.cloneRepository.bind(this) },
			{ title: 'Cleaning git directory', task: this.clearGitDirectory.bind(this) },
			{ title: 'Updating package.json', task: this.updatePackageJson.bind(this) },
			{ title: 'Updating plugin file', task: this.updatePluginFile.bind(this) },
			{ title: 'Updating readme', task: this.updateReadme.bind(this) },
		]

		this.log(chalk`Creating new ${type} {magenta ${names.pascal}}...`)
		await new Listr<Ctx>(tasks, { ctx }).run()
		this.log(chalk`Created ${type} {green ${names.pascal}}`)
	}

	async catch(error: Error) {
		// this.error(error as Error)
		throw error
	}

	generateNames(input: string, type: string): Names {
		const base = input.replace(/^swup/i, '').replace(/(plugin|theme)$/i, '').trim()
		const name = `Swup${pascalCase(base)}${upperFirst(type)}`

		return {
			pascal: name,
			kebab: kebabCase(name),
			title: startCase(name)
		}
	}

	async createDirectory(ctx: Ctx): Promise<void> {
		const exists = await fileExists(ctx.path)
		const dir = exists && await isDirectory(ctx.path)
		const empty = dir && await isEmptyDirectory(ctx.path)
		if (exists) {
			if (!dir) {
				throw new Error(`Unable to create directory ${ctx.dir}. A file of the same name already exists.`)
			}
			if (!empty) {
				throw new Error(`Directory ${ctx.dir} already exists and has files in it.`)
			}
			return
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
		await rimraf(join(ctx.path, '.git'))
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

	async updatePluginFile(ctx: Ctx): Promise<void> {
		const pluginPath = join(ctx.path, 'src/index.js')
		try {
			let data = await fs.readFile(pluginPath, 'utf8')
			data = data.replace(/PluginName/g, ctx.names.pascal)
			data = data.replace(/ThemeName/g, ctx.names.pascal)
			await fs.writeFile(pluginPath, data)
		} catch (error) {
			throw new Error(`Error updating plugin file: ${error}`)
		}
	}

	async updatePackageJson(ctx: Ctx): Promise<void> {
		const packagePath = join(ctx.path, 'package.json')
		let pckg: any
		try {
			pckg = JSON.parse(await fs.readFile(packagePath, 'utf8'))
		} catch (error) {
			throw new Error(`Error reading package.json: ${error}`)
		}

		pckg.name = ctx.names.kebab
		pckg.amdName = ctx.names.pascal
		pckg.version = '0.0.0'
		pckg.description = ''
		pckg.author.name = ''
		pckg.author.email = ''
		pckg.author.url = ''
		if (ctx.repo) {
			pckg.repository.url = ctx.repo
		} else {
			delete pckg.repository
		}

		try {
			await fs.writeFile(packagePath, JSON.stringify(pckg, null, 2))
		} catch (error) {
			throw new Error(`Error updating package.json: ${error}`)
		}
	}

	async updateReadme(ctx: Ctx): Promise<void> {
		const readmePath = join(ctx.path, 'readme.md')
		try {
			let data = await fs.readFile(readmePath, 'utf8')
			data = data.replace(/ *\[comment\]: CLI-remove-start[\s\S]*\[comment\]: CLI-remove-end */g, '')
			data = data.replace(/swup-\[(plugin-name|theme-name)\]-(plugin|theme)/g, ctx.names.kebab)
			data = data.replace(/Swup \[(Plugin Name|Theme Name)\] (Plugin|Theme)/g, ctx.names.title)
			data = data.replace(/ \[(Plugin Name|Theme Name)\]/g, ctx.names.title)
			data = data.replace(/Swup\[(PluginName|ThemeName)\](Plugin|Theme)/g, ctx.names.pascal)
			data = data.replace(/\[(PluginName|ThemeName)\]/g, ctx.names.pascal)
			data = data.replace(/(SwupNamePlugin|SwupNameTheme)/g, ctx.names.pascal)
			data = `${data.trim()}\n`
			await fs.writeFile(readmePath, data)
		} catch (error) {
			throw new Error(`Error updating readme: ${error}`)
		}
	}
}
