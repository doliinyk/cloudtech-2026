import { randomUUID } from 'crypto';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;

export const handler = async (event) => {
  const results = await Promise.allSettled(event.Records.map((record) => processRecord(record)));

  const failed = results
    .map((r, i) => ({ result: r, id: event.Records[i].messageId }))
    .filter(({ result }) => result.status === 'rejected');

  if (failed.length) {
    failed.forEach(({ result, id }) => console.error(`Failed messageId=${id}:`, result.reason));
    return {
      batchItemFailures: failed.map(({ id }) => ({ itemIdentifier: id }))
    };
  }
};

async function processRecord(record) {
  const payload = JSON.parse(record.body);
  const id = randomUUID();
  const processedAt = new Date().toISOString();

  const item = {
    id,
    content: payload.content,
    name: payload.name ?? null,
    email: payload.email ?? null,
    submittedAt: payload.submittedAt,
    processedAt
  };

  await dynamo.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item
  }));

  const s3Key = `feedback/${item.submittedAt.slice(0, 10)}/${id}.json`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: JSON.stringify(item, null, 2),
    ContentType: 'application/json'
  }));
}
