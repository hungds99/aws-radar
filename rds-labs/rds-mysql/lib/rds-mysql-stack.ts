import { Stack, StackProps } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { DatabaseInstance, DatabaseInstanceEngine, MysqlEngineVersion } from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export class RdsMysqlStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const defaultVpc = Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Create a new RDS MySQL instance
    const labMysqlDB = new DatabaseInstance(this, 'LabMysqlDB', {
      databaseName: 'lab-mysql-db',
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0_36,
      }),
      instanceType: InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.SMALL),
      vpc: defaultVpc,
    });
  }
}
