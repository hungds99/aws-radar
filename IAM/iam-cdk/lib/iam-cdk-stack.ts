import { Stack, StackProps } from 'aws-cdk-lib';
import {
  Effect,
  Group,
  Policy,
  PolicyStatement,
  Role,
  ServicePrincipal,
  User
} from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IamCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * Services: S3, DynamoDB, Lambda, API Gateway, CloudWatch Logs, Cloudfront, CloudFormation
     * Groups: Developer, QC
     * Users: Developer, QC
     **/

    // ====================================================================================================
    // Create a developer policy
    const developerPolicy = new Policy(this, 'developer-test-policy', {
      policyName: 'developer-test-policy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            's3:Get*',
            's3:List*',
            'dynamodb:Get*',
            'dynamodb:List*',
            'lambda:Get*',
            'lambda:List*'
          ],
          resources: ['*']
        })
      ]
    });

    // Create developer users
    const developer1User = new User(this, 'developer1-test-user', {
      userName: 'developer1-test-user'
    });
    const developer2User = new User(this, 'developer2-test-user', {
      userName: 'developer2-test-user'
    });
    const developer3User = new User(this, 'developer3-test-user', {
      userName: 'developer3-test-user'
    });

    // Create a developer group
    const developerGroup = new Group(this, 'developer-test-group', {
      groupName: 'developer-test-group'
    });
    // Attach the developer policy to the developer group
    developerGroup.attachInlinePolicy(developerPolicy);
    // Add the developer user to the developer group
    developerGroup.addUser(developer1User);
    developerGroup.addUser(developer2User);
    developerGroup.addUser(developer3User);
    // ====================================================================================================

    // ====================================================================================================
    // Create a admin policy
    const adminPolicy = new Policy(this, 'admin-test-policy', {
      policyName: 'admin-test-policy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:*', 'dynamodb:*', 'lambda:*'],
          resources: ['*']
        })
      ]
    });

    // Create a admin user
    const admin1User = new User(this, 'admin1-test-user', {
      userName: 'admin1-test-user'
    });
    const admin2User = new User(this, 'admin2-test-user', {
      userName: 'admin2-test-user'
    });

    // Create a admin group
    const adminGroup = new Group(this, 'admin-test-group', {
      groupName: 'admin-test-group'
    });
    // Attach the admin policy to the admin group
    adminGroup.attachInlinePolicy(adminPolicy);
    // Add the admin user to the admin group
    adminGroup.addUser(admin1User);
    adminGroup.addUser(admin2User);

    // ====================================================================================================

    // Create a Role for Lambda to access S3
    const lambdaPolicy = new Policy(this, 'lambda-test-policy', {
      policyName: 'lambda-test-policy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:Get*', 's3:List*'],
          resources: [
            'arn:aws:s3:::lambda-s3-trigger-demo',
            'arn:aws:s3:::lambda-s3-trigger-demo/*'
          ]
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
          resources: ['arn:aws:logs:*:*:*']
        })
      ]
    });
    const lambdaRole = new Role(this, 'lambda-test-role', {
      roleName: 'lambda-test-role',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    });
    lambdaRole.attachInlinePolicy(lambdaPolicy);

    // ====================================================================================================
  }
}
