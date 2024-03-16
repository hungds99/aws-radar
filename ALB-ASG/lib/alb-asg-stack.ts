import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  KeyPair,
  LaunchTemplate,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  UserData,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class AlbAsgStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a S3 bucket for web content
    const workshopWebBucket = new Bucket(this, 'workshop-test-web-bucket', {
      bucketName: 'workshop-test-web-bucket',
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Create a VPC with default configurations
    const vpc = Vpc.fromLookup(this, 'vpc', { isDefault: true });

    // Create a user data script to install Apache HTTP server
    const userData = UserData.forLinux({ shebang: '#!/bin/bash' });
    userData.addCommands(
      'yum install -y httpd',
      'service httpd start',
      `aws s3 cp s3://${workshopWebBucket.bucketName}/index.html /var/www/html/index.html`,
    );

    // Get key pair for EC2 instances
    const ec2KeyPair = KeyPair.fromKeyPairName(
      this,
      'workshop-test-key-pair',
      'workshop-test-key-pair',
    );

    // Create a Launch Template for EC2 instances
    const workshopLaunchTemplate = new LaunchTemplate(this, 'workshop-test-launch-template', {
      launchTemplateName: 'workshop-test-launch-template',
      keyPair: ec2KeyPair,
      userData: userData,
      machineImage: new AmazonLinuxImage({ generation: AmazonLinuxGeneration.AMAZON_LINUX_2023 }),
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      requireImdsv2: true,
    });
    workshopLaunchTemplate.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a Security Group for EC2 instances
    const workshopSecurityGroup = new SecurityGroup(this, 'workshop-test-security-group', {
      vpc: vpc,
      securityGroupName: 'workshop-test-security-group',
      description: 'Security Group for EC2 instances',
    });
    workshopSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.allTcp(),
      'Allow all traffic from the world',
    );
    workshopSecurityGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a new EC2 instance in public subnet
    const workshopServerPublic = new Instance(this, 'workshop-test-server-public', {
      vpc: vpc,
      instanceName: 'workshop-test-server-public',
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: new AmazonLinuxImage({ generation: AmazonLinuxGeneration.AMAZON_LINUX_2023 }),
      vpcSubnets: { availabilityZones: ['ap-southeast-1a'], subnetType: SubnetType.PUBLIC },
      requireImdsv2: true,
      userData: userData,
      keyPair: ec2KeyPair,
      securityGroup: workshopSecurityGroup,
    });
    workshopServerPublic.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:GetObject'],
        resources: [workshopWebBucket.bucketArn + '/*'],
      }),
    );
    workshopServerPublic.applyRemovalPolicy(RemovalPolicy.DESTROY);

    const workshopServer1Public = new Instance(this, 'workshop-test-server1-public', {
      vpc: vpc,
      instanceName: 'workshop-test-server1-public',
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: new AmazonLinuxImage({ generation: AmazonLinuxGeneration.AMAZON_LINUX_2023 }),
      vpcSubnets: { availabilityZones: ['ap-southeast-1b'], subnetType: SubnetType.PUBLIC },
      requireImdsv2: true,
      userData: userData,
      keyPair: ec2KeyPair,
      securityGroup: workshopSecurityGroup,
    });
    workshopServer1Public.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:GetObject'],
        resources: [workshopWebBucket.bucketArn + '/*'],
      }),
    );
    workshopServer1Public.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
