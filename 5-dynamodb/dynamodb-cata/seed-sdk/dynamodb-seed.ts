import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocument,
  marshallOptions,
  TransactWriteCommand,
  unmarshallOptions,
} from '@aws-sdk/lib-dynamodb';
import { generateCustomer } from './generate-csv-data';

const marshallOptions: marshallOptions = {
  convertClassInstanceToMap: false,
};
const unmarshallOptions: unmarshallOptions = {};

const translateConfig = { marshallOptions, unmarshallOptions };

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocument.from(client, translateConfig);

export const seedCustomers = async (count: number) => {
  console.info('🎨 Seeding customers data...');

  const parallelCount = count / 25;

  try {
    for (let i = 0; i < parallelCount; i++) {
      const customerTransactItems = Array.from({ length: 25 }, () => ({
        Put: {
          Item: generateCustomer(),
          TableName: 'labCataTable',
        },
        ConditionExpression: 'attribute_not_exists(id)',
      }));

      const response = await ddbDocClient.send(
        new TransactWriteCommand({
          TransactItems: customerTransactItems,
        }),
      );

      console.info(`💡 Batch ${i + 1} of ${parallelCount} seeded`);
      console.table(response);
    }
  } catch (error) {
    console.error('❌ Error seeding customers data: ', error);
    process.exit(1);
  }

  console.info('✅ Customers data seeded successfully...');
};
