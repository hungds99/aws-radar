import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  KeyPair,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  UserData,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class Ec2BasicStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // VPC default
    const ec2BasicDefaultVpc = Vpc.fromLookup(this, 'ec2-basic-default-vpc', { isDefault: true });

    // Create a user data script to install Apache HTTP server
    const ec2BasicUserData = UserData.forLinux({ shebang: '#!/bin/bash' });
    ec2BasicUserData.addCommands(
      'yum install -y httpd',
      'service httpd start',
      'echo "<h1>Hello, World from $(hostname -f)!</h1>" > /var/www/html/index.html',
    );

    // Get key pair for EC2 instances
    const ec2BasicKeyPair = KeyPair.fromKeyPairName(
      this,
      'ec2-basic-key-pair',
      'labs-ec2-key-pair',
    );

    // EC2 security group
    const ec2BasicSecurityGroup = new SecurityGroup(this, 'ec2-basic-sg', {
      vpc: ec2BasicDefaultVpc,
      securityGroupName: 'ec2-basic-sg',
      allowAllOutbound: true,
      description: 'EC2 security group',
    });
    ec2BasicSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'Allow HTTP access from the world',
    );

    // Create a new EC2 instance in public subnet
    const ec2BasicPublicServer = new Instance(this, 'ec2-basic-public-server', {
      vpc: ec2BasicDefaultVpc,
      instanceName: 'ec2-basic-public-server',
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: new AmazonLinuxImage({ generation: AmazonLinuxGeneration.AMAZON_LINUX_2023 }),
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      requireImdsv2: true,
      userData: ec2BasicUserData,
      keyPair: ec2BasicKeyPair,
      associatePublicIpAddress: true,
      securityGroup: ec2BasicSecurityGroup,
    });
    ec2BasicPublicServer.applyRemovalPolicy(RemovalPolicy.DESTROY);
    ec2BasicSecurityGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
