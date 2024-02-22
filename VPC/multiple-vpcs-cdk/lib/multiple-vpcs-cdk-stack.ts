import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
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
  NatProvider,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  UserData,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class MultipleVpcsCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    console.log('ID: ', id);

    // Create a S3 bucket
    const workshopBucket = new Bucket(this, `workshop-test-bucket`, {
      bucketName: `workshop-1-test-bucket`,
      versioned: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create a DynamoDB table
    const workshopTable = new Table(this, `workshop-test-table`, {
      tableName: `workshop-test-table`,
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    workshopTable.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a Parameter Store with 1 parameter secret and 1 parameter string
    const workshopPublicKeyParam = new StringParameter(this, 'workshop-public-key-param', {
      parameterName: '/workshop/public-key',
      stringValue: 'AAAAB3NzaC1yc2EAAAADAQABAAABgQDZ',
      description: 'Public key for workshop',
    });
    workshopPublicKeyParam.applyRemovalPolicy(RemovalPolicy.DESTROY);

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
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 1,
      natGatewayProvider: NatProvider.gateway(),
      natGatewaySubnets: { subnetType: SubnetType.PUBLIC, availabilityZones: ['ap-southeast-1a'] },
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
      vpcSubnets: { subnets: [vpc.privateSubnets[0]] },
      securityGroup: ec2PrivateSecurityGroup,
      userData: userData,
      associatePublicIpAddress: false,
      keyPair: ec2KeyPair,
      requireImdsv2: true,
    });
    workshopPrivateInstance.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // Attach a policy to the EC2 private instance
    const ec2PrivateInstancePolicy = new Policy(this, 'workshop-test-private-ec2-policy', {
      policyName: 'workshop-test-private-ec2-policy',
      statements: [
        new PolicyStatement({
          sid: 'AllowS3Access',
          effect: Effect.ALLOW,
          actions: ['s3:*'],
          resources: [workshopBucket.bucketArn, `${workshopBucket.bucketArn}/*`],
        }),
        new PolicyStatement({
          sid: 'AllowDynamoDBAccess',
          effect: Effect.ALLOW,
          actions: ['dynamodb:*'],
          resources: [workshopTable.tableArn],
        }),
        new PolicyStatement({
          sid: 'AllowParameterStoreAccess',
          effect: Effect.ALLOW,
          actions: ['ssm:GetParameter'],
          resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/workshop/public-key`],
        }),
      ],
    });
    workshopPrivateInstance.role?.attachInlinePolicy(ec2PrivateInstancePolicy);
    ec2PrivateInstancePolicy.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a Gateway Endpoint for S3 in the private subnet
    const s3GatewayEndpoint = new GatewayVpcEndpoint(this, 'workshop-test-s3-endpoint', {
      service: GatewayVpcEndpointAwsService.S3,
      vpc,
      subnets: [{ subnets: [vpc.privateSubnets[0]] }],
    });
    s3GatewayEndpoint.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a Gateway Endpoint for DynamoDB in the private subnet
    const dynamodbGatewayEndpoint = new GatewayVpcEndpoint(
      this,
      'workshop-test-dynamodb-endpoint',
      {
        service: GatewayVpcEndpointAwsService.DYNAMODB,
        vpc,
        subnets: [{ subnets: [vpc.privateSubnets[0]] }],
      },
    );
    dynamodbGatewayEndpoint.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a Interface Endpoint for SSM in the private subnet
    const ssmInterfaceEndpoint = new InterfaceVpcEndpoint(this, 'workshop-test-ssm-endpoint', {
      service: InterfaceVpcEndpointAwsService.SSM,
      vpc,
      subnets: { subnets: [vpc.privateSubnets[0]] },
      securityGroups: [ec2PrivateSecurityGroup],
    });
    ssmInterfaceEndpoint.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
