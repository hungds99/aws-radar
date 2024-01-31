import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  GatewayVpcEndpoint,
  GatewayVpcEndpointAwsService,
  Instance,
  InstanceType,
  InterfaceVpcEndpoint,
  InterfaceVpcEndpointAwsService,
  KeyPair,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  UserData,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class VpcCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a S3 bucket
    const workshopBucket = new Bucket(this, `workshop-test-bucket`, {
      bucketName: `workshop-1-test-bucket`,
      versioned: true,
    });

    // Create a VPC and 4 subnets (2 public, 2 private)
    const vpc = new Vpc(this, 'workshop-test-vpc', {
      vpcName: 'workshop-test-vpc',
      createInternetGateway: true,
      availabilityZones: ['ap-southeast-1a', 'ap-southeast-1b'],
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'workshop-test-public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'workshop-test-private',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
    vpc.applyRemovalPolicy(RemovalPolicy.DESTROY);

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

    // Create a security group for the public EC2 instances
    const ec2PublicSecurityGroup = new SecurityGroup(this, 'workshop-test-public-sg', {
      vpc,
      securityGroupName: 'workshop-test-public-sg',
      description: 'Security group for public EC2 instances',
      allowAllOutbound: true,
    });
    ec2PublicSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'Allow HTTPS access from the world',
    );
    ec2PublicSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'Allow HTTP access from the world',
    );
    ec2PublicSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(22),
      'Allow SSH access from the world',
    );
    ec2PublicSecurityGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a EC2 instance in the public subnet
    const workshopPublicInstance = new Instance(this, 'workshop-test-public-ec2', {
      vpc,
      instanceName: 'workshop-test-public-ec2',
      instanceType: new InstanceType('t2.micro'),
      machineImage: new AmazonLinuxImage({ generation: AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      vpcSubnets: { subnets: [vpc.publicSubnets[1]] },
      securityGroup: ec2PublicSecurityGroup,
      userData: userData,
      keyPair: ec2KeyPair,
      requireImdsv2: true,
    });
    workshopPublicInstance.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a security group for the bastion host
    const ec2BastionSecurityGroup = new SecurityGroup(this, 'workshop-test-bastion-sg', {
      vpc,
      securityGroupName: 'workshop-test-bastion-sg',
      description: 'Security group for the bastion host',
    });
    ec2BastionSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(22),
      'Allow SSH access from the world',
    );
    ec2BastionSecurityGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // Create a bastion host in the public subnet
    const bastionHost = new Instance(this, 'workshop-test-bastion-host', {
      vpc,
      instanceName: 'workshop-test-bastion-host',
      instanceType: new InstanceType('t2.micro'),
      machineImage: new AmazonLinuxImage({ generation: AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      vpcSubnets: { subnets: [vpc.publicSubnets[0]] },
      securityGroup: ec2BastionSecurityGroup,
      keyPair: ec2KeyPair,
      requireImdsv2: true,
    });
    bastionHost.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a security group for the private EC2 instances
    const ec2PrivateSecurityGroup = new SecurityGroup(this, 'workshop-test-private-sg', {
      vpc,
      securityGroupName: 'workshop-test-private-sg',
      description: 'Security group for private EC2 instances',
    });
    // Allow SSH access from the bastion host security group
    ec2PrivateSecurityGroup.addIngressRule(
      ec2BastionSecurityGroup,
      Port.tcp(22),
      'Allow SSH access from the bastion host',
    );

    ec2PrivateSecurityGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // Create a EC2 instance in the private subnet
    const workshopPrivateInstance = new Instance(this, 'workshop-test-private-ec2', {
      vpc,
      instanceName: 'workshop-test-private-ec2',
      instanceType: new InstanceType('t2.micro'),
      machineImage: new AmazonLinuxImage({ generation: AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      vpcSubnets: { subnets: [vpc.isolatedSubnets[0]] },
      securityGroup: ec2PrivateSecurityGroup,
      userData: userData,
      associatePublicIpAddress: false,
      keyPair: ec2KeyPair,
      requireImdsv2: true,
    });
    // Attach a policy to the EC2 private instance
    const ec2PrivateInstancePolicy = new Policy(this, 'workshop-test-private-ec2-policy', {
      policyName: 'workshop-test-private-ec2-policy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:*'],
          resources: [workshopBucket.bucketArn, `${workshopBucket.bucketArn}/*`],
        }),
      ],
    });
    workshopPrivateInstance.role?.attachInlinePolicy(ec2PrivateInstancePolicy);
    workshopPrivateInstance.applyRemovalPolicy(RemovalPolicy.DESTROY);
    ec2PrivateInstancePolicy.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a Gateway Endpoint for S3 in the private subnet
    const s3GatewayEndpoint = new GatewayVpcEndpoint(this, 'workshop-test-s3-endpoint', {
      service: GatewayVpcEndpointAwsService.S3,
      vpc,
      subnets: [{ subnets: [vpc.isolatedSubnets[0]] }],
    });
    s3GatewayEndpoint.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a Interface Endpoint for SSM in the private subnet
    const ssmInterfaceEndpoint = new InterfaceVpcEndpoint(this, 'workshop-test-ssm-endpoint', {
      service: InterfaceVpcEndpointAwsService.SSM,
      vpc,
      subnets: { subnets: [vpc.isolatedSubnets[0]] },
      securityGroups: [ec2PrivateSecurityGroup],
    });
    ssmInterfaceEndpoint.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
