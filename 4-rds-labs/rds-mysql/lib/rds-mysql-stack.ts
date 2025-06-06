import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  MysqlEngineVersion,
  PostgresEngineVersion,
} from 'aws-cdk-lib/aws-rds';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class RdsMysqlStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const defaultVpc = Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    // Create a new RDS MySQL instance
    // const labMysqlDB = new DatabaseInstance(this, 'LabMysqlDB', {
    //   vpc: defaultVpc,
    //   databaseName: 'labMysqlDB',
    //   engine: DatabaseInstanceEngine.mysql({
    //     version: MysqlEngineVersion.VER_8_0_36,
    //   }),
    //   instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
    //   vpcSubnets: { subnetType: SubnetType.PUBLIC },
    //   publiclyAccessible: true,
    //   deleteAutomatedBackups: true,
    // });
    // labMysqlDB.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // new CfnOutput(this, 'LabMysqlDBEndpoint', {
    //   value: labMysqlDB.dbInstanceEndpointAddress,
    // });

    // Create a new RDS PostgreSQL instance
    const labPostgresDB = new DatabaseInstance(this, 'LabPostgresDB', {
      vpc: defaultVpc,
      databaseName: 'labPostgresDB',
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_16_2,
      }),
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      publiclyAccessible: true,
      deleteAutomatedBackups: true,
    });
    labPostgresDB.applyRemovalPolicy(RemovalPolicy.DESTROY);
    new CfnOutput(this, 'LabPostgresDBEndpoint', {
      value: labPostgresDB.dbInstanceEndpointAddress,
    });
  }
}
