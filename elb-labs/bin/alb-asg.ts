#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { Ec2TemplateStack } from '../lib/ec2-template-stack';
import { ElbStack } from '../lib/elb-stack';
import { VpcStack } from '../lib/vpc-stack';

const app = new cdk.App();
new VpcStack(app, 'VpcStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: 'The VPC stack of labs hands-ob',
});

new Ec2TemplateStack(app, 'Ec2TemplateStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: 'The EC2 template stack of labs hands-on',
});

new ElbStack(app, 'ElbStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: 'The ELB stack of labs hands-on',
});
