#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Ec2EfsStack } from '../lib/ec2-efs-stack';

const app = new cdk.App();
new Ec2EfsStack(app, 'Ec2EfsStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: 'The AWS CDK stack for the EC2 EFS Lab',
});
