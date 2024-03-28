/*
 * Dynamodb Transactions allow you can group actions together and submit them as single-all or nothing
 * Use "TransactWriteItems" or "TransactGetItems"
 */

import { DynamoDB } from '@aws-sdk/client-dynamodb'; // ES6 import
import { DynamoDBDocument, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDB({
  region: 'ap-southeast-1',
});
const marshallOptions = {};
const unmarshallOptions = {};
const translateConfig = { marshallOptions, unmarshallOptions };
const ddbDocClient = DynamoDBDocument.from(client, translateConfig);

interface OrderItem {
  productId: string;
  createdAt: string;
  quantity: number;
}

const randomId = () => Math.random().toString(36).substring(7);

async function createProducts(): Promise<void> {
  try {
    const transactWriteCommand = new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: 'TransactionsDemo',
            Item: {
              id: 'productA',
              name: 'Product A',
              quantity: 10,
              createdAt: new Date().toISOString(),
              __type: 'product',
            },
          },
        },
        {
          Put: {
            TableName: 'TransactionsDemo',
            Item: {
              id: 'productB',
              name: 'Product B',
              quantity: 20,
              createdAt: new Date().toISOString(),
              __type: 'product',
            },
          },
        },
      ],
    });

    await ddbDocClient.send(transactWriteCommand);
    console.log('Products created successfully!');
  } catch (error) {
    console.error('Error creating products:', error);
  }
}

async function placeOrder(orderId: string, orderItems: OrderItem[]): Promise<void> {
  const transactItems: any = orderItems.map((item) => {
    console.log('item', item);
    return {
      Update: {
        TableName: 'TransactionsDemo',
        Key: { id: item.productId, createdAt: item.createdAt },
        UpdateExpression: 'set quantity = quantity - :val',
        ConditionExpression: 'quantity >= :val',
        ExpressionAttributeValues: {
          ':val': item.quantity,
        },
      },
    };
  });

  // Add the order to the orders table as part of the transaction
  transactItems.push({
    Put: {
      TableName: 'TransactionsDemo',
      Item: {
        id: orderId,
        orderItems: orderItems,
        createdAt: new Date().toISOString(),
        __type: 'order',
      },
    },
  });

  const command = new TransactWriteCommand({
    TransactItems: transactItems,
  });

  try {
    await ddbDocClient.send(command);
    console.log('Order placed successfully!');
  } catch (error) {
    console.error('Failed to place order:', error);
  }
}

// Example usage
const orderId = 'order1';
const orderItems: OrderItem[] = [
  { productId: 'productA', createdAt: '2024-03-28T09:44:16.560Z', quantity: 2 },
  { productId: 'productB', createdAt: '2024-03-28T09:44:16.564Z', quantity: 1 },
];

// createProducts();
placeOrder(orderId, orderItems).then(() => console.log('Transaction complete'));
