require = require('esm')(module)

const {prepareChrome} = require('../chrome')
const {asyncForEach, Log, isUrl} = require('../utils')
const Crawler = require('crawler')


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
            const correctNumberOfContainers = await getNumberOfContainers(page, config.swup.containers)
            let source = ''
            const getUrlsToCheck = async () => {
                if (config.validate.urls) {
                    source = 'provided URLs'
                    return config.validate.urls
                }

                if (flags.testUrl) {
                    source = 'single CLI testUrl option'
                    return [flags.testUrl]
                }

                if (flags.findUrls) {
                    logger.group(`Crawling site ${flags.findUrls}`)
                    const urlsToCheck = await new Promise(resolve => {
                        let urls = []
                        const origin = new URL(config.validate.against).origin;
                        const crawler = new Crawler({
                            maxConnections: 10,
                            skipDuplicates: true,
                            callback: function (error, res, done) {
                                if (error) {
                                    console.log(error)
                                }

                                if (!res.$) {
                                    done()
                                    return
                                }

                                urls.push(res.request.uri.href)

                                const $ = res.$
                                $('a[href]').each(function () {
                                    const href = $(this).attr('href')

                                    if (!href) {
                                        done()
                                        return false
                                    }

                                    if (!new RegExp('.(gif|jpg|png|bmp|jpeg|pdf)$', 'i').test(href)) {
                                        if (href.startsWith('http')) {
                                            if (href.startsWith(origin)) {
                                                crawler.queue(href)
                                            }
                                        } else if (href.startsWith('/')) {
                                            crawler.queue(new URL(`${origin}${href}`).href)
                                        }
                                    }
                                })

                                setTimeout(done) // I guess jQuery dom reading is slow?
                            },
                        })

                        crawler.queue(flags.findUrls)
                        crawler.on('drain', () => resolve(urls))
                    })

                    source = 'crawled site URLs'
                    return urlsToCheck
                }

                if (config.validate.sitemap) {
                    let sitemap
                    source = `sitemap ${config.validate.sitemap}`

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

            logger.group(`Validating using ${source}`)

            await asyncForEach(urlsToCheck, async url => {
                const page = await visitPage(url)
                const pageErrors = []

                logger.temporaryLog(`Testing url ${info(url)} ${RUNNING}`)

                if (flags.runTests === 'containers') {
                    pageErrors.push(await validateNumberOfContainers(page, url, correctNumberOfContainers, config.swup.containers))
                } else if (flags.runTests === 'transition-duration') {
                    pageErrors.push(await validateTransitionDurationStyles(page, url, config.swup.animationSelector))
                } else if (flags.runTests === 'transition-styles') {
                    pageErrors.push(await validateTransitionStyles(page, url, config.swup.animationSelector, config.validate.stylesExpectedToChange))
                } else {
                    pageErrors.push(await validateNumberOfContainers(page, url, correctNumberOfContainers, config.swup.containers))
                    pageErrors.push(await validateTransitionDurationStyles(page, url, config.swup.animationSelector))
                    pageErrors.push(await validateTransitionStyles(page, url, config.swup.animationSelector, config.validate.stylesExpectedToChange))
                }

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
    testUrl: flags.string({
        char: 't',
        description: 'Run tests for single URL.',
        required: false,
        default: null,
    }),
    runTests: flags.string({
        char: 'r',
        description: 'Run only specific test',
        required: false,
        default: 'all',
        options: ['all', 'containers', 'transition-duration', 'transition-styles'],
    }),
    findUrls: flags.string({
        char: 'f',
        description: 'Crawl site and find URLs to check automatically (page that are not linked from other pages, like 404, won\'t be checked)',
        required: false,
        default: null,
    }),
}

module.exports = ValidateCommand
