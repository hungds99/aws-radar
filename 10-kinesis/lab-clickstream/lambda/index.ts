import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: 'ap-southeast-1',
});
const BUCKET_NAME = 'clickstream-analytics-bucket';
const PREFIX = 'clickstream-events/';

export async function handler(event: any) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Process the incoming event
  for (const record of event.Records) {
    const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
    console.log('Decoded payload:', payload);

    try {
      // Create a unique key for S3 using timestamp to prevent overwrites
      const timestamp = record.kinesis.approximateArrivalTimestamp || Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const key = `${PREFIX}${new Date(timestamp * 1000).toISOString()}-${randomId}.json`;

      // Upload the record to S3
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: payload,
        ContentType: 'application/json',
      });

      const response = await s3Client.send(command);
      console.log(`Successfully saved to S3: ${response}`);
    } catch (error) {
      console.error('Error processing record:', error);
    }
  }

  return `Successfully processed ${event.Records.length} records and saved them to S3.`;
}
