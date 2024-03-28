import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  InstanceClass,
  InstanceSize,
  InstanceType,
  KeyPair,
  LaunchTemplate,
  UserData,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class Ec2TemplateStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a user data script to install Apache HTTP server
    const userData = UserData.forLinux({ shebang: '#!/bin/bash' });
    userData.addCommands(
      'yum install -y httpd',
      'service httpd start',
      `echo "<h1>Hello World from $(hostname -f)</h1>" > /var/www/html/index.html`,
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
  }
}
