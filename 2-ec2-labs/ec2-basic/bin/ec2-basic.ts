#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Ec2BasicStack } from '../lib/ec2-basic-stack';

const app = new cdk.App();
new Ec2BasicStack(app, 'Ec2BasicStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: 'The AWS CDK stack for the EC2 Basic Lab',
});
