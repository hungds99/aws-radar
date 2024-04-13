#!/usr/bin/env node
import 'source-map-support/register';
import { RdsMysqlStack } from '../lib/rds-mysql-stack';
import { App } from 'aws-cdk-lib';

const app = new App();
new RdsMysqlStack(app, 'RdsMysqlStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: 'The AWS CDK stack for the RDS MySQL Lab.',
});
