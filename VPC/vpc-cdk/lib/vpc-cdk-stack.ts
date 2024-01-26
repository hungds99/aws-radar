import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  AmazonLinuxImage,
  Instance,
  InstanceType,
  KeyPair,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  UserData,
  Vpc
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class VpcCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a VPC and 4 subnets (2 public, 2 private)
    const vpc = new Vpc(this, 'workshop-test-vpc', {
      vpcName: 'workshop-test-vpc',
      createInternetGateway: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'workshop-test-public',
          subnetType: SubnetType.PUBLIC
        },
        {
          cidrMask: 24,
          name: 'workshop-test-private',
          subnetType: SubnetType.PRIVATE_ISOLATED
        }
      ]
    });
    vpc.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a user data script to install Apache HTTP server
    const userData = UserData.forLinux();
    userData.addCommands(
      'sudo yum install -y httpd',
      'sudo systemctl start httpd',
      'sudo systemctl enable httpd',
      'sudo echo "<h1>Hello, World from $(hostname -f)!</h1>" > /var/www/html/index.html'
    );

    // Get key pair for EC2 instances
    const ec2KeyPair = KeyPair.fromKeyPairName(
      this,
      'workshop-test-key-pair',
      'workshop-test-key-pair'
    );

    // Create a security group for the public EC2 instances
    const ec2PublicSecurityGroup = new SecurityGroup(this, 'workshop-test-public-sg', {
      vpc,
      securityGroupName: 'workshop-test-public-sg',
      description: 'Security group for public EC2 instances',
      allowAllOutbound: true
    });
    ec2PublicSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'Allow HTTPS access from the world'
    );
    ec2PublicSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'Allow HTTP access from the world'
    );
    ec2PublicSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(22),
      'Allow SSH access from the world'
    );
    ec2PublicSecurityGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a EC2 instance in the public subnet
    const workshopPublicInstance = new Instance(this, 'workshop-test-public-ec2', {
      vpc,
      instanceName: 'workshop-test-public-ec2',
      instanceType: new InstanceType('t2.micro'),
      machineImage: new AmazonLinuxImage(),
      vpcSubnets: {
        subnets: [vpc.publicSubnets[0]]
      },
      securityGroup: ec2PublicSecurityGroup,
      userData: userData,
      keyPair: ec2KeyPair,
      requireImdsv2: true
    });
    workshopPublicInstance.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create a security group for the private EC2 instances
    const ec2PrivateSecurityGroup = new SecurityGroup(this, 'workshop-test-private-sg', {
      vpc,
      securityGroupName: 'workshop-test-private-sg',
      description: 'Security group for private EC2 instances'
    });
    ec2PrivateSecurityGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);
    // Create a EC2 instance in the private subnet
    const workshopPrivateInstance = new Instance(this, 'workshop-test-private-ec2', {
      vpc,
      instanceName: 'workshop-test-private-ec2',
      instanceType: new InstanceType('t2.micro'),
      machineImage: new AmazonLinuxImage(),
      vpcSubnets: {
        subnets: [vpc.isolatedSubnets[0]]
      },
      securityGroup: ec2PrivateSecurityGroup,
      userData: userData,
      associatePublicIpAddress: false,
      keyPair: ec2KeyPair,
      requireImdsv2: true
    });
    workshopPrivateInstance.applyRemovalPolicy(RemovalPolicy.DESTROY);
  }
}
