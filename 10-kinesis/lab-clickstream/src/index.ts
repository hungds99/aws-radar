import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis'; // ES Modules import

const client = new KinesisClient({
  region: 'ap-southeast-1',
});

async function sendClickstreamData() {
  try {
    const clickstreamData = {
      userId: 'user123',
      timestamp: new Date().toISOString(),
      event: 'pageView',
      details: {
        page: 'home',
        element: 'button',
      },
    };

    const command = new PutRecordCommand({
      StreamName: 'clickstream-data-stream',
      PartitionKey: 'user123',
      Data: new TextEncoder().encode(JSON.stringify(clickstreamData)),
    });
    const response = await client.send(command);
    console.log('Clickstream data sent successfully:', response);
  } catch (error) {
    console.error('Error sending clickstream data:', error);
  }
}

sendClickstreamData();
