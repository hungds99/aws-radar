import { Stack, StackProps } from 'aws-cdk-lib';
import { Effect, Policy, PolicyStatement, Role, User } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IamCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a developer policy
    const developerPolicy = new Policy(this, 'IamDeveloperPolicy', {
      policyName: 'developer-policy-test-iam',
      statements: [
        //  Read only access to S3
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:Get*', 's3:List*'],
          resources: ['*']
        }),
        // Read only access to DynamoDB
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['dynamodb:Get*', 'dynamodb:List*'],
          resources: ['*']
        }),
        // Read only access to Lambda
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['lambda:Get*', 'lambda:List*'],
          resources: ['*']
        })
      ]
    });

    // Create a developer user
    const developerUser = new User(this, 'IamDeveloperUser', {
      userName: 'developer-user-test-iam',
    });
    developerUser.attachInlinePolicy(developerPolicy);

    // Create a admin policy
    const adminPolicy = new Policy(this, 'IamAdminPolicy', {
      policyName: 'admin-policy-test-iam',
      statements: [
        // Full access to S3
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:*'],
          resources: ['*']
        }),
        // Full access to DynamoDB
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['dynamodb:*'],
          resources: ['*']
        }),
        // Full access to Lambda
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['lambda:*'],
          resources: ['*']
        })
      ]
    });
    
    // Create a admin role
    const adminRole = new Role(this, 'IamAdminRole', {
      roleName: 'admin-role-test-iam',
      assumedBy: developerUser,
      inlinePolicies: {
        adminPolicy: adminPolicy.document
      },
    });
  }
}
