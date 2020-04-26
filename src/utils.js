const normal = require('chalk/source').white
const error = require('chalk/source').red
const info = require('chalk/source').cyan
const success = require('chalk/source').green

export const asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

export const isUrl = str => str.startsWith('http')

export class Log {
    group(text, color = info) {
        this.nl()
        this.log(text, color, 0)
    }

    info(text) {
        this.log(text, info, 1)
    }

    error(text) {
        this.log(text, error, 1)
    }

    success(text) {
        this.log(text, success, 1)
    }

    log(text, color = normal, level = 1) {
        console.log(color(`${'  '.repeat(level)}${text}`))
    }

    nl() {
        this.log('', normal)
    }

    generateReport(logger, errors) {
        const cleanErrors = errors.filter(i => typeof i === 'object')

        if (cleanErrors.length > 0) {
            cleanErrors.forEach(err => {
                logger.group(err.text, error)
                logger.log(`-> on page ${err.page}`)

                logger.success(`expected: ${err.expected}`)
                logger.error(`received: ${err.received}`)
            })
        } else {
            logger.success('All validations PASSED')
        }
    }
}
