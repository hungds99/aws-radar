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
import { FileSystem } from 'aws-cdk-lib/aws-efs';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/*
 * note:
 * - EFS is not support Windows instances
 */

export class Ec2EfsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Default VPC
    const defaultVPC = Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true });

    // Create a user data script to install Apache HTTP server
    const ec2BasicUserData = UserData.forLinux({ shebang: '#!/bin/bash' });
    ec2BasicUserData.addCommands(
      'yum install -y httpd',
      'service httpd start',
      'echo "<h1>Your server hosted in $(hostname -f)!</h1>" > /var/www/html/index.html',
    );

    // Get key pair for EC2 instances
    const ec2BasicKeyPair = KeyPair.fromKeyPairName(
      this,
      'ec2-basic-key-pair',
      'labs-ec2-key-pair',
    );

    // EC2 security group
    const ec2BasicSecurityGroup = new SecurityGroup(this, 'ec2-basic-sg', {
      vpc: defaultVPC,
      securityGroupName: 'ec2-basic-sg',
      allowAllOutbound: true,
      description: 'EC2 security group',
    });
    ec2BasicSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'Allow HTTP access from the world',
    );
    ec2BasicSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(22),
      'Allow SSH access from the world',
    );
    ec2BasicSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'Allow HTTPS access from the world',
    );
    ec2BasicSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(2049),
      'Allow NFS access from the world',
    );

    // Create a new EC2 instance in public subnet
    const ec2BasicPublicServer = new Instance(this, 'ec2-basic-public-server', {
      vpc: defaultVPC,
      instanceName: 'ec2-efs-public-server',
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: new AmazonLinuxImage({ generation: AmazonLinuxGeneration.AMAZON_LINUX_2023 }),
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      requireImdsv2: false,
      userData: ec2BasicUserData,
      keyPair: ec2BasicKeyPair,
      associatePublicIpAddress: true,
      securityGroup: ec2BasicSecurityGroup,
    });

    ec2BasicPublicServer.applyRemovalPolicy(RemovalPolicy.DESTROY);
    ec2BasicSecurityGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // EFS file system
    const efs = FileSystem.fromFileSystemAttributes(this, 'efs', {
      fileSystemId: 'fs-088190d65c7d06dbb',
      securityGroup: ec2BasicSecurityGroup,
    });
  }
}
