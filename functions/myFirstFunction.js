const axios = require('axios')

exports.handler = async function(event, context, callback) {
    console.info('event: ', event)
    console.info('context: ', context)

    const name = event.queryStringParameters.name

    const baseUrl = `https://absbullsearch.absglobal.com/api/animal/search?Animal=${name}&ProofCode=USA&VisibilityCountryCode=USA&SearchIncludesPedigree=false`

    const req = await axios.get(baseUrl, {
        headers: {
            Accept: 'application/json'
        }
    })

    callback(null, {
        statusCode: 200,
        body: JSON.stringify(req.data),
        headers: {
            'Cache-Control': 'maxage=604800, public'
        }
    })
}
