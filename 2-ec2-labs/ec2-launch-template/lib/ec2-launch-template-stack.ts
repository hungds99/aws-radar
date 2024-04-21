import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  EbsDeviceVolumeType,
  InstanceClass,
  InstanceSize,
  InstanceType,
  KeyPair,
  LaunchTemplate,
  UserData,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class Ec2LaunchTemplateStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const labWebServerKeyPair = KeyPair.fromKeyPairName(
      this,
      'lab-webserver-keypair',
      'lab-webserver-keypair',
    );

    const labWebServerUserData = UserData.forLinux({
      shebang: '#!/bin/bash',
    });
    labWebServerUserData.addCommands(
      'yum update -y',
      'yum install -y nodejs git nginx',
      'npm install -g pm2',
      'systemctl start nginx',
      'systemctl enable nginx',
    );

    const labWebServerLaunchTemplate = new LaunchTemplate(this, 'lab-webserver-launch-template', {
      launchTemplateName: 'lab-webserver-launch-template',
      keyPair: labWebServerKeyPair,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: new AmazonLinuxImage({ generation: AmazonLinuxGeneration.AMAZON_LINUX_2023 }),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: {
            ebsDevice: {
              volumeSize: 8,
              volumeType: EbsDeviceVolumeType.GP2,
              deleteOnTermination: true,
            },
          },
        },
      ],
      requireImdsv2: true,
    });

    new CfnOutput(this, 'labWebServerLaunchTemplateId', {
      key: 'labWebServerLaunchTemplateID',
      value: labWebServerLaunchTemplate.launchTemplateId || '',
    });

    new CfnOutput(this, 'labWebServerLaunchTemplateVersion', {
      key: 'labWebServerLaunchTemplateVersion',
      value: labWebServerLaunchTemplate.latestVersionNumber || '',
    });
  }
}
