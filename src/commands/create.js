const {Command, flags} = require('@oclif/command')
const fs = require('fs')
const clone = require('git-clone')
const rimraf = require('rimraf')
const Spinner = require('cli-spinner').Spinner

const pluginTemplateRepo = 'https://github.com/swup/plugin-template.git'
const themeTemplateRepo = 'https://github.com/swup/theme-template.git'
const toKebabCase = string => {
    return string.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase()
}
const toCapitalCase = str => str.charAt(0).toUpperCase() + str.slice(1)
const toNormalCase = str => str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())

class CreateCommand extends Command {
    async run() {
        const {flags} = this.parse(CreateCommand)

        // get name of plugin/theme
        const defaultName = toCapitalCase(flags.name)
        const isTheme = flags.type === 'theme'
        const repo = flags.repo
        const shortName = `${defaultName}${isTheme ? 'Theme' : 'Plugin'}`
        const name = `Swup${shortName}`
        const kebabCaseName = toKebabCase(name)
        const templateRepo = isTheme ? themeTemplateRepo : pluginTemplateRepo
        const pathName = `${process.cwd()}/${name}`

        // start
        const spinner = new Spinner(`%s Creating ${isTheme ? 'theme' : 'plugin'} called ${name}`)
        spinner.setSpinnerString(17)
        spinner.start()

        let counter = 0
        let numberOfTasks = 4
        const done = () => {
            counter++
            if (counter === numberOfTasks) {
                this.log(`🎉 ${isTheme ? 'Theme' : 'Plugin'} created from template in folder ${name}`)
            }
        }

        const rewritePackageJson = () => {
            const packageJsonPath = `${pathName}/package.json`
            const packageJson = require(packageJsonPath)
            packageJson.name = kebabCaseName

            // change repo url
            if (repo) {
                packageJson.repository.url = repo
            } else {
                delete packageJson.repository
            }

            // reset author
            packageJson.author.name = ''
            packageJson.author.email = ''
            packageJson.author.url = ''

            // reset general info
            packageJson.version = '0.0.0'
            packageJson.description = ''

            fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), err => {
                if (err) return this.warn('⚠️ ' + err)
                this.log('✅ Changed package.json.')
                done()
            })
        }

        const rewritePluginFile = () => {
            const pluginFilePath = `${pathName}/src/index.js`

            fs.readFile(pluginFilePath, 'utf8', (err, data) => {
                if (err) return this.warn(err)

                data = data.replace(/PluginName/g, shortName)
                data = data.replace(/ThemeName/g, shortName)

                fs.writeFile(pluginFilePath, data, err => {
                    if (err) return this.warn(err)
                    this.log('✅ Changed plugin file.')
                    done()
                })
            })
        }

        const rewriteReadmeFile = () => {
            const pluginReadmePath = `${pathName}/readme.md`

            fs.readFile(pluginReadmePath, 'utf8', (err, data) => {
                if (err) return this.warn(err)

                // remove template info
                data = data.replace(/ *\[comment\]: CLI-remove-start[\s\S]*\[comment\]: CLI-remove-end */g, '')

                // replace names
                data = data.replace(/swup-\[plugin-name\]-plugin/g, kebabCaseName)
                data = data.replace(/swup-\[theme-name\]-theme/g, kebabCaseName)

                data = data.replace(/ \[Plugin Name\]/g, toNormalCase(defaultName))
                data = data.replace(/ \[Theme Name\]/g, toNormalCase(defaultName))

                data = data.replace(/\[PluginName\]/g, defaultName)
                data = data.replace(/\[ThemeName\]/g, defaultName)

                data = data.replace(/SwupNamePlugin/g, name)
                data = data.replace(/SwupNameTheme/g, name)

                fs.writeFile(pluginReadmePath, data, err => {
                    if (err) return this.warn(err)
                    this.log('✅ Changed plugin readme.')
                    done()
                })
            })
        }

        const cleanup = () => {
            rimraf(pathName, () => {
            })
        }

        // create directory
        if (fs.existsSync(pathName)) {
            spinner.stop(true)
            this.warn(`⚠️ Directory ${name} already exists.`)
            return
        }
        fs.mkdirSync(pathName)

        // clone template repo
        clone(templateRepo, pathName, err => {
            spinner.stop(true)
            if (err) {
                this.warn('⚠️ ' + err)
                cleanup()
                return
            }
            this.log(`✅ Cloned ${isTheme ? 'theme' : 'plugin'} template repo.`)

            // delete template git files
            rimraf(`${pathName}/.git`, () => {
                this.log('✅ Removed git files.')
                done()
            })

            // change name in package.json
            rewritePackageJson()

            // replace all name placeholders in plugin file
            rewritePluginFile()

            // replace all name placeholders in readme file
            rewriteReadmeFile()
        })
    }
}

CreateCommand.description = 'Create new swup plugin and themes in seconds.'

CreateCommand.flags = {
    name: flags.string({
        char: 'n',
        description: 'Defines name of plugin (Swup[YourName]Plugin).',
        required: true,
    }),
    repo: flags.string({
        char: 'r',
        description: 'Defines git repository url of plugin.',
    }),
    type: flags.string({
        char: 't',
        default: 'plugin',
        options: ['plugin', 'theme'],
        description: 'Can choose to create theme instead.',
    }),
}

module.exports = CreateCommand
