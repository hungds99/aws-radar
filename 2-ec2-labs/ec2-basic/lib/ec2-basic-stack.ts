import { CfnOutput, RemovalPolicy, Size, Stack, StackProps } from 'aws-cdk-lib';
import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  CfnInstance,
  EbsDeviceVolumeType,
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
  Volume,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Policy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
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
      requireImdsv2: false,
      userData: ec2BasicUserData,
      keyPair: ec2BasicKeyPair,
      associatePublicIpAddress: true,
      securityGroup: ec2BasicSecurityGroup,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: {
            virtualName: 'ephemeral0',
            ebsDevice: {
              volumeSize: 8,
              volumeType: EbsDeviceVolumeType.GENERAL_PURPOSE_SSD,
              deleteOnTermination: true,
              encrypted: true,
            },
          },
        },
      ],
    });

    // Enable termination protection
    const cfnInstance = ec2BasicPublicServer.node.defaultChild as CfnInstance;
    cfnInstance.disableApiTermination = true;

    ec2BasicPublicServer.applyRemovalPolicy(RemovalPolicy.DESTROY);
    ec2BasicSecurityGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Output
    new CfnOutput(this, 'ec2-basic-public-server-public-ip', {
      value: ec2BasicPublicServer.instancePublicIp,
      description: 'Public IP address of the EC2 instance',
    });
  }
}
