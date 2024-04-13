import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { DatabaseInstance, DatabaseInstanceEngine, MysqlEngineVersion } from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class RdsMysqlStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const defaultVpc = Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Create a new RDS MySQL instance
    const labMysqlDB = new DatabaseInstance(this, 'LabMysqlDB', {
      vpc: defaultVpc,
      databaseName: 'labMysqlDB',
      engine: DatabaseInstanceEngine.MYSQL,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      publiclyAccessible: true,
    });
    labMysqlDB.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
