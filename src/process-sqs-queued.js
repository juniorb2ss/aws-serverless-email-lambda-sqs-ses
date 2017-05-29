'use strict';

const AWS = require('aws-sdk');

const Lawos = require('lawos');
 
const Lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
const SQS = new AWS.SQS({apiVersion: '2012-11-05'});
var Q = require( "q" );
var sqsName = process.env.sqs;

// Proxy the appropriate SQS methods to ensure that they "unwrap" the common node.js
// error / callback pattern and return Promises. Promises are good and make it easier to
// handle sequential asynchronous data.
var getQueueUrl = Q.nbind( SQS.getQueueUrl, SQS );

const done = (err, res) => callback(null, {
    statusCode: err ? '400' : '200',
    body: err ? err.message : JSON.stringify(res),
    headers: {
        'Content-Type': 'application/json',
    },
});

module.exports.handler = (event, context, callback) => { 
	console.log("request: " + JSON.stringify(event));
	
	getQueueUrl({QueueName: sqsName})
		.then(function (data) {
	    		var queueUrl = data['QueueUrl'];
				const Q = new Lawos(queueUrl, SQS, Lambda);

				// Process every list of messages with a lambda function
				Q.list(process.env.worker);

				// Run until all messages are process or less than one second runtime is
				// left for the lambda function.
				Q.work(
					() => Promise.resolve(context.getRemainingTimeInMillis() < 500)
				).then(
					data => {
					  callback(null, data);
					}
				);
		    }
		).catch(function (error) {
				done(error);
			}
		);
};