const axios = require('axios')
const AWS = require('aws-sdk')

const credentials = new AWS.EnvironmentCredentials('MY_AWS')

AWS.config.update({ region: 'us-east-2', credentials })
const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' })

const storeInCache = async (value) => {
    const params = {
        TableName: 'cownames',
        Item: value
    }

    return await ddb.put(params).promise()
}

const checkCache = async (name) => {
    const params = {
        TableName: 'cownames',
        Key: { name }
    }

    const result = await ddb.get(params).promise()

    if (result.Item) {
        return result
    } else {
        throw new Error('Cache miss')
    }
}

function oneSuccess(promises) {
    return Promise.all(
        promises.map((p) => {
            // If a request fails, count that as a resolution so it will keep
            // waiting for other possible successes. If a request succeeds,
            // treat it as a rejection so Promise.all immediately bails out.
            return p.then(
                (val) => Promise.reject(val),
                (err) => Promise.resolve(err)
            )
        })
    ).then(
        // If '.all' resolved, we've just got an array of errors.
        (errors) => Promise.reject(errors),
        // If '.all' rejected, we've got the result we wanted.
        (val) => Promise.resolve(val)
    )
}

exports.handler = function(event, context, callback) {
    const name = event.queryStringParameters.name

    const baseUrl = `https://absbullsearch.absglobal.com/api/animal/search?Animal=${name}&ProofCode=USA&VisibilityCountryCode=USA&SearchIncludesPedigree=false`

    const cacheMiss = axios.get(baseUrl, {
        headers: {
            Accept: 'application/json'
        }
    })

    const cacheHit = checkCache(name)

    oneSuccess([cacheHit, cacheMiss]).then(async (result) => {
        if (result.Item) {
            callback(null, {
                statusCode: 200,
                body: JSON.stringify(result)
            })
            return
        }

        const newCacheItem = {
            name,
            cowNames: result.data,
            TTL: Math.floor(Date.now() / 1000 + 60 * 60 * 24 * 30)
        }

        await storeInCache(newCacheItem)

        callback(null, {
            statusCode: 200,
            body: JSON.stringify({
                Item: {
                    cowNames: result.data
                }
            })
        })
    })
}
