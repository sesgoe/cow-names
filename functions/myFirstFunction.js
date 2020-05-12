const Promise = require('bluebird')
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

// checks the cache for the existence of a particular name
// if name does not exist in cache, the promise rejects to be able to use Promise.any on the backup web call
const checkCache = async (name) => {
    const params = {
        TableName: 'cownames',
        Key: { name }
    }

    const result = await ddb.get(params).promise()

    if (result.Item) {
        return result
    } else {
        throw new Error(`Cache miss for ${name}`)
    }
}

exports.handler = async function(event, context) {
    const start = new Date().getTime()
    const name = event.queryStringParameters.name
    const baseUrl = `https://absbullsearch.absglobal.com/api/animal/search?Animal=${name}&ProofCode=USA&VisibilityCountryCode=USA&SearchIncludesPedigree=false`

    const cacheMiss = axios.get(baseUrl, {
        headers: {
            Accept: 'application/json'
        }
    })

    const cacheHit = checkCache(name)

    const result = await Promise.any([cacheMiss, cacheHit])

    // cache hit
    if (result.Item) {
        console.info('Cache hit for ', name)
        const end = new Date().getTime()
        console.info(`duration: ${end - start} ms`)
        return { statusCode: 200, body: JSON.stringify(result) }
    }

    // cache miss
    const newCacheItem = {
        name,
        cowNames: result.data,
        TTL: Math.floor(Date.now() / 1000 + 60 * 60 * 24 * 30) // expires in 1 month
    }

    console.info('Cache miss for ', name)

    await storeInCache(newCacheItem)

    const end = new Date().getTime()
    console.info(`duration: ${end - start} ms`)

    return { statusCode: 200, body: JSON.stringify(newCacheItem) }
}
