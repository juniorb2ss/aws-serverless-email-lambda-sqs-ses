'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ses = new AWS.SES();

module.exports.handler = (event, context, callback) => {
	console.log("request: " + JSON.stringify(event));

	const body = JSON.parse(JSON.parse(event[0]['Body']).body);

	ses.sendEmail(body, function(err, data) {
		callback(err, data);
	});
};