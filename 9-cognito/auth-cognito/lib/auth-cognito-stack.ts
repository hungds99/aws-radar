import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { AccountRecovery, Mfa, UserPool } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AuthCognitoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create an user pool
    const userPool = new UserPool(this, 'LabUserPool', {
      userPoolName: 'LabUserPool',
      signInAliases: {
        email: true,
      },
      mfa: Mfa.OFF,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      selfSignUpEnabled: true,
    });

    // Create an app client
    const appClient = userPool.addClient('LabUserPoolClient', {
      userPoolClientName: 'LabUserPoolClient',
    });

    // Output
    new CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });
    new CfnOutput(this, 'UserPoolAppClientId', {
      value: appClient.userPoolClientId,
    });
  }
}
