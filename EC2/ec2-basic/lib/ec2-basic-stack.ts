import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  KeyPair,
  SubnetType,
  UserData,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class Ec2BasicStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a VPC with default configurations
    const vpc = new Vpc(this, 'workshop-test-vpc');

    // Create a user data script to install Apache HTTP server
    const userData = UserData.forLinux({ shebang: '#!/bin/bash' });
    userData.addCommands(
      'yum install -y httpd',
      'service httpd start',
      'echo "<h1>Hello, World from $(hostname -f)!</h1>" > /var/www/html/index.html',
    );

    // Get key pair for EC2 instances
    const ec2KeyPair = KeyPair.fromKeyPairName(
      this,
      'workshop-test-key-pair',
      'workshop-test-key-pair',
    );

    // Create a new EC2 instance in public subnet
    const workshopServerPublic = new Instance(this, 'workshop-test-server-public', {
      vpc,
      instanceName: 'workshop-test-server-public',
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: new AmazonLinuxImage({ generation: AmazonLinuxGeneration.AMAZON_LINUX_2023 }),
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC,
      },
      requireImdsv2: true,
      userData: userData,
      keyPair: ec2KeyPair,
      detailedMonitoring: true,
    });
    workshopServerPublic.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
