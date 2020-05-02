exports.handler = function(event, context, callback) {
    callback(null, {
        statusCode: 200,
        body: "Hello, world! I'm a netlify function!"
    })
}
