import { Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class DynamodbCataStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const labCataBucket = new Bucket(this, 'labCataBucket', {
      bucketName: 'lab-dynamodb-cata',
    });

    const labCataTable = new Table(this, 'labCataTable', {
      tableName: 'labCataTable',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      sortKey: { name: 'name', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
    });

    labCataTable.addLocalSecondaryIndex({
      indexName: 'flowersCountIndex',
      sortKey: { name: 'flowersCount', type: AttributeType.NUMBER },
    });

    labCataTable.addGlobalSecondaryIndex({
      indexName: 'groupIdJoinedAtIndex',
      partitionKey: { name: 'groupId', type: AttributeType.STRING },
      sortKey: { name: 'joinedAt', type: AttributeType.STRING },
    });

    labCataTable.addGlobalSecondaryIndex({
      indexName: 'threadIdPostedAtIndex',
      partitionKey: { name: 'threadId', type: AttributeType.STRING },
      sortKey: { name: 'postedAt', type: AttributeType.STRING },
    });
  }
}
