#!/usr/bin/env node
import { App, Aspects } from 'aws-cdk-lib';
import 'source-map-support/register';
import { LabsIamStack } from '../lib/labs-iam-stack';
import { AwsSolutionsChecks } from 'cdk-nag';

const app = new App();
new LabsIamStack(app, 'LabsIamStack', {
  description: 'The AWS CDK stack for IAM lab',
});

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
