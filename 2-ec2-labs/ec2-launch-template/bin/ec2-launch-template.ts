#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import { Ec2LaunchTemplateStack } from '../lib/ec2-launch-template-stack';

const app = new App();
new Ec2LaunchTemplateStack(app, 'Ec2LaunchTemplateStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: 'A lab EC2 webserver launch template by CDK',
});
