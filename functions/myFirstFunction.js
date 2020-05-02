const chromium = require('chrome-aws-lambda')

exports.handler = async function(event, context, callback) {
    const browser = await chromium.puppeteer.launch({
        headless: true
    })

    const page = await browser.newPage()
    await page.goto(
        'https://absbullsearch.absglobal.com/Search/Bull?animal=Ses&proof=USA&country=USA'
    )

    const content = await page.content()

    if (browser != null) {
        await browser.close()
    }

    callback(null, {
        statusCode: 200,
        body: content
    })
}
