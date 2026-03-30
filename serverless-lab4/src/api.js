import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});
const QUEUE_URL = process.env.QUEUE_URL;

export const handler = async event => {
	try {
		const httpMethod = event.requestContext?.httpMethod;

		if (httpMethod !== 'POST') {
			return {
				statusCode: 405,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: 'Method Not Allowed' })
			};
		}

		let body = {};
		try {
			body = JSON.parse(event.body || '{}');
		} catch {
			return {
				statusCode: 400,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: 'Invalid JSON body' })
			};
		}

		if (!body.content) {
			return {
				statusCode: 400,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: 'Field "content" is required' })
			};
		}

		const messageBody = JSON.stringify({
			content: body.content,
			name: body.name ?? null,
			email: body.email ?? null,
			submittedAt: new Date().toISOString()
		});

		await sqs.send(new SendMessageCommand({
			QueueUrl: QUEUE_URL,
			MessageBody: messageBody
		}));

		return {
			statusCode: 202,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'queued' })
		};
	} catch (err) {
		console.error('API handler error:', err);
		return {
			statusCode: 500,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: 'Internal Server Error' })
		};
	}
};
