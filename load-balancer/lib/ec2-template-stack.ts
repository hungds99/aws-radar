import { Stack, StackProps } from 'aws-cdk-lib';
import {
  AmazonLinuxImage,
  InstanceClass,
  InstanceSize,
  InstanceType,
  KeyPair,
  LaunchTemplate,
  Peer,
  Port,
  SecurityGroup,
  UserData,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class Ec2TemplateStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const labsVpc = Vpc.fromLookup(this, 'labsVpc', {
      vpcName: 'labs-vpc',
    });

    // Create/Get a existing a launch template for the auto scaling group
    const labsEc2Sg = new SecurityGroup(this, 'labsEc2Sg', {
      vpc: labsVpc,
      securityGroupName: 'labs-ec2-sg',
      allowAllOutbound: true,
      description: 'A security group for the EC2 instances in the labs',
    });
    const labsAlbSg = SecurityGroup.fromLookupByName(this, 'labsAlbSg', 'labs-alb-sg', labsVpc);
    labsEc2Sg.addIngressRule(
      Peer.securityGroupId(labsAlbSg.securityGroupId),
      Port.tcp(80),
      'Allow HTTP traffic',
    );
    const labsEc2UserData = UserData.forLinux({ shebang: '#!/bin/bash' });
    labsEc2UserData.addCommands(
      'yum install -y httpd',
      'service httpd start',
      `echo "<h1>Hello World from $(hostname -f)</h1>" > /var/www/html/index.html`,
    );
    const labsEc2KeyPair = KeyPair.fromKeyPairName(this, 'labsEc2KeyPair', 'labs-ec2-key-pair');
    const labsEc2LaunchTemplate = new LaunchTemplate(this, 'labsEc2LaunchTemplate', {
      launchTemplateName: 'labs-ec2-launch-template',
      securityGroup: labsEc2Sg,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: new AmazonLinuxImage({}),
      userData: labsEc2UserData,
      keyPair: labsEc2KeyPair,
    });
  }
}
