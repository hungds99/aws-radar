import { Stack, StackProps } from 'aws-cdk-lib';
import {
  AmazonLinuxImage,
  Instance,
  InstanceType,
  SecurityGroup,
  SubnetType,
  Vpc
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class VpcCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a VPC and 4 subnets (2 public, 2 private)
    const vpc = new Vpc(this, 'workshop-test-vpc', {
      vpcName: 'workshop-test-vpc',
      cidr: '10.0.0.0/16',
      createInternetGateway: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'workshop-test-public-1-subnet',
          subnetType: SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: 'workshop-test-public-2-subnet',
          subnetType: SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: 'workshop-test-private-1-subnet',
          subnetType: SubnetType.PRIVATE_ISOLATED
        },
        {
          cidrMask: 24,
          name: 'workshop-test-private-2-subnet',
          subnetType: SubnetType.PRIVATE_ISOLATED
        }
      ]
    });

    // Create a security group for the public EC2 instances
    const ec2PublicSecurityGroup = new SecurityGroup(this, 'workshop-test-public-sg', {
      vpc,
      securityGroupName: 'workshop-test-public-sg',
      description: 'Security group for public EC2 instances',
      allowAllOutbound: true
    });
    // Create a EC2 instance in the public subnet
    const workshopPublicInstance = new Instance(this, 'workshop-test-public-ec2', {
      vpc,
      instanceType: new InstanceType('t2.micro'),
      machineImage: new AmazonLinuxImage(),
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC
      },
      securityGroup: ec2PublicSecurityGroup
    });

    // Create a security group for the private EC2 instances
    const ec2PrivateSecurityGroup = new SecurityGroup(this, 'workshop-test-private-sg', {
      vpc,
      securityGroupName: 'workshop-test-private-sg',
      description: 'Security group for private EC2 instances'
    });
    // Create a EC2 instance in the private subnet
    const workshopPrivateInstance = new Instance(this, 'workshop-test-private-ec2', {
      vpc,
      instanceType: new InstanceType('t2.micro'),
      machineImage: new AmazonLinuxImage(),
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      securityGroup: ec2PrivateSecurityGroup
    });
  }
}
