const puppeteer = require('puppeteer')

export const prepareChrome = async () => {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})

    const visitPage = async url => {
        const page = await browser.newPage()
        await page.goto(url)

        return page
    }

    const getNumberOfContainers = async (page, containersSelectors) => {
        return await page.evaluate(containersSelectors => {
            return document.querySelectorAll(containersSelectors.join(', ')).length
        }, containersSelectors)
    }

    const validateNumberOfContainers = async (page, url, correctNumberOfContainers, containers) => {
        const numberOfContainers = await getNumberOfContainers(page, containers)

        if (correctNumberOfContainers !== numberOfContainers) {
            return {
                text: 'Incorrect number of containers',
                expected: correctNumberOfContainers,
                received: numberOfContainers,
                page: url,
            }
        }
    }

    const getStyles = (animatedElements, prop) => {
        const elements = Array.prototype.slice.call(document.querySelectorAll(animatedElements))
        return elements.map(item => {
            const styles = window.getComputedStyle(item)
            return {[prop]: styles.getPropertyValue(prop)}
        })
    }
    const switchAnimatedClass = () => {
        document.documentElement.classList.add('is-animating')
    }
    const getAllStylesExpectedToChange = async (page, stylesExpectedToChange, animatedElements) => {
        const values = await Promise.all(stylesExpectedToChange.map(s => page.evaluate(getStyles, animatedElements, s)))
        return values// .reduce((c, a, []) => ({...a, ...c}))
    }
    const mapData = (transitionDuration, before, after) => {
        return transitionDuration.map((item, index) => {
            return {
                ...item,
                before: {
                    ...before.map(item => ({...item[index]})).reduce((c, a) => ({...a, ...c})),
                },
                after: {
                    ...after.map(item => ({...item[index]})).reduce((c, a) => ({...a, ...c})),
                },
            }
        })
    }

    const validateTransitionDurationStyles = async (page, url, animatedElements) => {
        const transitionDuration = await page.evaluate(getStyles, animatedElements, 'transition-duration')

        return transitionDuration.map(element => {
            if (parseFloat(element['transition-duration']) === 0) {
                return {
                    text: 'Animated element has transition-duration set to 0s',
                    expected: 'not 0s',
                    received: element['transition-duration'],
                    page: url,
                }
            }
            return false
        }).filter(i => i)[0]
    }

    const validateTransitionStyles = async (page, url, animatedElements, stylesExpectedToChange) => {
        const transitionDuration = await page.evaluate(getStyles, animatedElements, 'transition-duration')
        const before = await getAllStylesExpectedToChange(page, stylesExpectedToChange, animatedElements)
        await page.evaluate(switchAnimatedClass)
        await new Promise(resolve => setTimeout(resolve, 1000))
        const after = await getAllStylesExpectedToChange(page, stylesExpectedToChange, animatedElements)

        const elementsStyles = mapData(transitionDuration, before, after)

        return elementsStyles.map(element => {
            const changed = Object.keys(element.before).map(key => element.before[key] !== element.after[key])
            const atLeastOneChanged = changed.reduce((c, a) => a || c, false)

            if (!atLeastOneChanged) {
                return {
                    text: 'At least one animated style property must change with class "is-animating"',
                    expected: `Not ${JSON.stringify(element.before)}`,
                    received: JSON.stringify(element.after),
                    page: url,
                }
            }

            return false
        }).filter(i => i)[0]
    }

    const killChrome = async () => {
        await browser.close()
    }

    return {visitPage, getNumberOfContainers, validateNumberOfContainers, validateTransitionDurationStyles, validateTransitionStyles, killChrome}
}
