import {
  DynamoDBClient,
  TransactWriteItem,
  TransactWriteItemsCommand,
} from '@aws-sdk/client-dynamodb';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { marshall } from '@aws-sdk/util-dynamodb';

// Initialize clients
const s3Client = new S3Client({
  region: 'ap-southeast-1',
});
const dynamoDbClient = new DynamoDBClient({
  region: 'ap-southeast-1',
});

const BUCKET_NAME = 'clickstream-analytics-bucket';
const PREFIX = 'clickstream-events/';
const CLICKSTREAM_DATA_TABLE = 'clickstream-data';
const CLICKSTREAM_DATA_ANALYTICS_TABLE = 'clickstream-data-analytics';

export async function handler(event: any) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Process the incoming event
  for (const record of event.Records) {
    const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
    console.log('Decoded payload:', payload);

    try {
      // Parse the JSON payload
      const parsedPayload = JSON.parse(payload);

      // Create a unique key for S3 using timestamp to prevent overwrites
      const timestamp = record.kinesis.approximateArrivalTimestamp || Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const key = `${PREFIX}${new Date(timestamp * 1000).toISOString()}-${randomId}.json`;

      // Upload the record to S3
      const s3Command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: payload,
        ContentType: 'application/json',
      });

      const transactItems: TransactWriteItem[] = [
        {
          Put: {
            TableName: CLICKSTREAM_DATA_TABLE,
            Item: marshall(parsedPayload),
          },
        },
      ];

      if (parsedPayload.event === 'pageView') {
        transactItems.push({
          Update: {
            TableName: CLICKSTREAM_DATA_ANALYTICS_TABLE,
            Key: marshall({ userId: parsedPayload.userId, event: 'pageView' }),
            UpdateExpression: 'SET #count = if_not_exists(#count, :start) + :inc',
            ExpressionAttributeNames: { '#count': 'count' },
            ExpressionAttributeValues: marshall({ ':start': 0, ':inc': 1 }),
          },
        });
      }

      const transactCommand = new TransactWriteItemsCommand({
        TransactItems: transactItems,
      });

      // Execute both commands in parallel
      const [s3Response, dynamoDbResponse] = await Promise.all([
        s3Client.send(s3Command),
        dynamoDbClient.send(transactCommand),
      ]);

      console.log(`Successfully saved to S3: ${JSON.stringify(s3Response)}`);
      console.log(`Successfully saved to DynamoDB: ${JSON.stringify(dynamoDbResponse)}`);
    } catch (error) {
      console.error('Error processing record:', error);
    }
  }

  return `Successfully processed ${event.Records.length} records and saved them to S3 and DynamoDB.`;
}
