import * as fs from 'fs/promises'
import { Command, Flags, ux } from '@oclif/core'
import clone from 'git-clone'
import { Listr } from 'listr2'
import { camelCase, kebabCase, startCase, upperFirst } from 'lodash'

import { pascalCase } from '../../util.js'

interface Names {
    upper: string
    pascal: string
    title: string
    kebab: string
    short: string
    full: string
}

enum Types {
    plugin = 'plugin',
    theme = 'theme'
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

  templateRepos = {
    plugin: 'https://github.com/swup/plugin-template.git',
    theme: 'https://github.com/swup/theme-template.git'
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(Create)
    const { name, type, repo } = flags

    const n = name.replace(/^swup/i, '').replace(/(plugin|theme)$/i, '').trim()
    const names: Names = {
        upper: upperFirst(n),
        pascal: pascalCase(n),
        kebab: kebabCase(n),
        title: startCase(n),
        short: `${pascalCase(n)}${upperFirst(type)}`,
        full: `Swup${pascalCase(n)}${upperFirst(type)}`,
    }

    const pathName = `${process.cwd()}/${names.full}`

    const tasks = new Listr(
        [
            {
                title: 'Update package.json',
                task: () => this.updatePackageJson({ path: pathName, names, repo })
            },
            {
                title: 'Update plugin file',
                task: () => this.updatePluginFile({ path: pathName, names })
            }
        ],
        { concurrent: false }
    )

    try {
        await tasks.run()
    } catch (error) {
        this.error(`${error}`)
    }

    // start
    ux.action.start(`Creating ${type} called ${names.full}`)

    let counter = 0
    let numberOfTasks = 4
    const done = () => {
        counter++
        if (counter === numberOfTasks) {
            this.log(`🎉 Created ${type} from template in ./${names.full}`)
        }
    }

        const cleanup = () => {
            rimraf(pathName, () => {
            })
        }

        // create directory
        if (fs.existsSync(pathName)) {
            ux.action.stop('failed')
            this.warn(`⚠️ Directory ${names.full} already exists.`)
            return
        }
        fs.mkdirSync(pathName)

        // clone template repo
        const templateRepo = this.templateRepos[type]
        clone(templateRepo, pathName, err => {
            if (err) {
                ux.action.stop('failed')
                this.warn('⚠️ ' + err)
                cleanup()
                return
            }

            ux.action.stop()
            this.log(`✅ Cloned ${type} template repo.`)

            // delete template git files
            rimraf(`${pathName}/.git`, () => {
                this.log('✅ Removed git files.')
                done()
            })

            rewritePackageJson()
            updatePluginFile()
            rewriteReadmeFile()
        })
    }

    async cloneRepo({ type }: { type: string }): Promise<void> {
        const repo = this.templateRepos[type]
        clone(repo, pathName, err => {
            if (err) {
                ux.action.stop('failed')
                this.warn('⚠️ ' + err)
                cleanup()
                return
            }

            ux.action.stop()
            this.log(`✅ Cloned ${type} template repo.`)

            // delete template git files
            rimraf(`${pathName}/.git`, () => {
                this.log('✅ Removed git files.')
                done()
            })

            rewritePackageJson()
            updatePluginFile()
            rewriteReadmeFile()
        })
    }

    async updatePluginFile({ path, names }: { path: string, names: Names }) {
        const pluginPath = `${path}/src/index.js`
        try {
            let data = await fs.readFile(pluginPath, 'utf8')
            data = data.replace(/PluginName/g, names.short)
            data = data.replace(/ThemeName/g, names.short)
            await fs.writeFile(pluginPath, data)
        } catch (error) {
            throw new Error(`Couldn't update plugin file: ${error}`)
        }
    }

    async updatePackageJson({ path, names, repo }: { path: string, names: Names, repo?: string }): Promise<void> {
        const packagePath = `${path}/package.json`
        let pckg: any
        try {
            pckg = JSON.parse(await fs.readFile(packagePath, 'utf8'))
        } catch (error) {
            throw new Error(`Couldn't read package.json: ${error}`)
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
            this.log('✅ Changed package.json.')
        } catch (error) {
            throw new Error(`Couldn't update package.json: ${error}`)
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
            throw new Error(`Couldn't update readme: ${error}`)
        }
    }
}
