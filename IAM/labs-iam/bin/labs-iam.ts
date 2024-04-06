#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import { LabsIamStack } from '../lib/labs-iam-stack';

const app = new App();
new LabsIamStack(app, 'LabsIamStack', {
  description: 'The AWS CDK stack for IAM lab',
});
