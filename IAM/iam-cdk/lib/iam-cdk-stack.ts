import { Stack, StackProps } from 'aws-cdk-lib';
import { Effect, Group, Policy, PolicyStatement, User } from 'aws-cdk-lib/aws-iam';
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
    const developerPolicy = new Policy(this, 'IamDeveloperPolicy', {
      policyName: 'developer-policy-test-iam',
      statements: [
        // Read access to S3, DynamoDB, Lambda
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

    // Create a developer user
    const developerUser = new User(this, 'IamDeveloperUser', {
      userName: 'developer-user-test-iam'
    });
    const developerUser2 = new User(this, 'IamDeveloperUser2', {
      userName: 'developer-user2-test-iam'
    });
    const developerUser3 = new User(this, 'IamDeveloperUser3', {
      userName: 'developer-user3-test-iam'
    });

    // Create a developer group
    const developerGroup = new Group(this, 'IamDeveloperGroup', {
      groupName: 'developer-group-test-iam'
    });
    // Attach the developer policy to the developer group
    developerGroup.attachInlinePolicy(developerPolicy);
    // Add the developer user to the developer group
    developerGroup.addUser(developerUser);
    developerGroup.addUser(developerUser2);
    developerGroup.addUser(developerUser3);
    // ====================================================================================================

    // ====================================================================================================
    // Create a admin policy
    const adminPolicy = new Policy(this, 'IamAdminPolicy', {
      policyName: 'admin-policy-test-iam',
      statements: [
        // Full access to S3, DynamoDB, Lambda
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['s3:*', 'dynamodb:*', 'lambda:*'],
          resources: ['*']
        })
      ]
    });

    // Create a admin user
    const adminUser = new User(this, 'IamAdminUser', {
      userName: 'admin-user-test-iam'
    });
    const adminUser2 = new User(this, 'IamAdminUser2', {
      userName: 'admin-user2-test-iam'
    });

    // Create a admin group
    const adminGroup = new Group(this, 'IamAdminGroup', {
      groupName: 'admin-group-test-iam'
    });
    // Attach the admin policy to the admin group
    adminGroup.attachInlinePolicy(adminPolicy);
    // Add the admin user to the admin group
    adminGroup.addUser(adminUser);
    adminGroup.addUser(adminUser2);
    // ====================================================================================================
  }
}
