require = require('esm')(module)

const {prepareChrome} = require('../chrome')
const {asyncForEach, Log, isUrl} = require('../utils')

const {Command, flags} = require('@oclif/command/lib')
const fs = require('fs')
const path = require('path')
const info = require('chalk/source').cyan
const labelPass = require('chalk/source').bgGreen
const labelFail = require('chalk/source').bgRed
const labelRunning = require('chalk/source').bgYellow
const black = require('chalk/source').black
const parser = require('xml2json')
const fetch = require('node-fetch')
const {promisify} = require('util')
const {exit} = process
const readFile = promisify(fs.readFile)

const FAIL = labelFail(black(' FAIL '))
const PASS = labelPass(black(' PASS '))
const RUNNING = labelRunning(black(' RUNNING '))

class ValidateCommand extends Command {
    async run() {
        let errors = []
        const {flags} = this.parse(ValidateCommand)
        const logger = new Log()

        try {
            const configExists = fs.existsSync(path.join(process.cwd(), flags.config))
            if (!configExists) {
                throw new Error('Swup project config not found.')
            }

            const configFile = require(path.join(process.cwd(), flags.config))
            if (!configFile.default) {
                throw new Error('Swup project config has no default export.')
            }

            const config = configFile.default
            logger.group('Preparing')

            logger.log('Waiting for Chrome to be ready')
            const {
                visitPage,
                getNumberOfContainers,
                validateNumberOfContainers,
                validateTransitionDurationStyles,
                validateTransitionStyles,
                killChrome,
            } = await prepareChrome()

            logger.log('Getting main page to validate against')
            const page = await visitPage(config.validate.against)
            const correctNumberOfContainers = await getNumberOfContainers(page, config.swupOptions.containers)
            const getUrlsToCheck = async () => {
                if (config.validate.urls) {
                    return config.validate.urls
                }

                if (config.validate.sitemap) {
                    let sitemap

                    if (isUrl(config.validate.sitemap)) {
                        sitemap = await (fetch(config.validate.sitemap).then(res => res.text()))
                    } else {
                        sitemap = await readFile(path.join(process.cwd(), config.validate.sitemap))
                    }

                    return (JSON.parse(parser.toJson(sitemap)).urlset.url.map(i => i.loc))
                }

                throw new Error('Swup project config not found.')
            }
            const urlsToCheck = await getUrlsToCheck()

            logger.group(`Validating using ${config.validate.sitemap ? `sitemap ${config.validate.sitemap}` : 'provided URLs'}`)

            await asyncForEach(urlsToCheck, async url => {
                const page = await visitPage(url)
                const pageErrors = []

                logger.temporaryLog(`Testing url ${info(url)} ${RUNNING}`)

                pageErrors.push(await validateNumberOfContainers(page, url, correctNumberOfContainers, config.swupOptions.containers))
                pageErrors.push(await validateTransitionDurationStyles(page, url, config.swupOptions.animationSelector))
                pageErrors.push(await validateTransitionStyles(page, url, config.swupOptions.animationSelector, config.validate.stylesExpectedToChange))

                logger.removeTemporaryLog(`Testing url ${info(url)} ${pageErrors.filter(el => (el !== undefined)).length === 0 ? PASS : FAIL}`)

                errors = errors.concat(pageErrors)
            })

            killChrome()

            logger.group('Summary')
            logger.generateReport(logger, errors)

            if (errors.filter(e => e).length > 0) {
                throw new Error('Some validations failed')
            }

            exit(0)
        } catch (error) {
            this.error(error)
            exit(1)
        }
    }
}

ValidateCommand.description = 'Validate your site pages.'

ValidateCommand.flags = {
    config: flags.string({
        char: 'c',
        description: 'Defines name of swup config file.',
        required: false,
        default: 'swup.config.js',
    }),
}

module.exports = ValidateCommand
