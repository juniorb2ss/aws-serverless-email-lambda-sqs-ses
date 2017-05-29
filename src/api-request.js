'use strict';

const AWS = require('aws-sdk');
const SQS = new AWS.SQS({apiVersion: '2012-11-05'});
var Q = require( "q" );


module.exports.handler = (event, context, callback) => {
	console.log("request: " + JSON.stringify(event));

	const sqsName = process.env.sqs
	const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
        },
    });

	// Proxy the appropriate SQS methods to ensure that they "unwrap" the common node.js
	// error / callback pattern and return Promises. Promises are good and make it easier to
	// handle sequential asynchronous data.
	var getQueueUrl = Q.nbind( SQS.getQueueUrl, SQS );
	var sendMessage = Q.nbind( SQS.sendMessage, SQS );

	getQueueUrl({QueueName: sqsName})
	.then(
    	function handleGetResolve( data ) {
    		const queueUrl = data['QueueUrl'];

			var sqsParams = {
			  MessageBody: JSON.stringify(event),
			  QueueUrl: queueUrl
			};

			// Now that we have a Q-ified method, we can send the message.
			sendMessage(sqsParams)
			.then(
			    function handleSendResolve(data) {
			    	done(null, data);
			    }
			).catch(
			    function handleReject( error ) {
			    	done(error);
			    }
			);
	    }
	).catch(
	    function handleReject( error ) {
	    	 done(null, error);
	    }
	);
};