import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  AccountPrincipal,
  Effect,
  Group,
  ManagedPolicy,
  Policy,
  PolicyStatement,
  Role,
  ServicePrincipal,
  User,
} from 'aws-cdk-lib/aws-iam';
import { LogFormat, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class LabsIamStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create service resource
    // S3 Bucket
    const labS3Bucket = new Bucket(this, 'lab-iam-bucket', {
      bucketName: 'lab-iam-bucket',
    });
    labS3Bucket.applyRemovalPolicy(RemovalPolicy.DESTROY);
    new CfnOutput(this, 'lab-iam-bucket-output', {
      key: 'labIamBucket',
      value: labS3Bucket.bucketName,
    });
    // Lambda Function
    const labLambda = new NodejsFunction(this, 'lab-iam-lambda', {
      functionName: 'lab-iam-lambda',
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: 'src/index.ts',
      logFormat: LogFormat.JSON,
      description: 'Lab IAM Lambda',
    });
    labLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);
    new CfnOutput(this, 'lab-iam-lambda-output', {
      key: 'labIamLambda',
      value: labLambda.functionName,
    });

    // Developer Policy: Define policy allow write/read s3 bucket (lab-iam-bucket) and lambda function (lab-iam-lambda)
    const devPolicyStatement = new PolicyStatement({
      sid: 'AllowReadWriteToDevelopmentServices',
      effect: Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:GetObject',
        's3:ListBucket',
        's3:ListAllMyBuckets',
        'lambda:InvokeFunction',
        'lambda:ListFunctions',
        'lambda:GetFunction',
        'lambda:UpdateFunctionCode',
      ],
      resources: [labS3Bucket.bucketArn, `${labS3Bucket.bucketArn}/*`, labLambda.functionArn],
      // conditions: {
      //   BoolIfExists: {
      //     'aws:MultiFactorAuthPresent': 'true',
      //   },
      // },
    });
    const devPolicy = new Policy(this, 'lab-iam-policy', {
      policyName: 'labs-iam-policy',
      statements: [devPolicyStatement],
    });
    // Developer User: Define user with developer policy
    const devUser = new User(this, 'lab-dev-user', {
      userName: 'lab-dev-user',
    });
    devUser.attachInlinePolicy(devPolicy);
    new CfnOutput(this, 'lab-iam-user-output', {
      key: 'labIamDevUser',
      value: devUser.userName,
    });
    // Developer Group: Define group with developer policy
    const devGroup = new Group(this, 'lab-dev-group', {
      groupName: 'lab-dev-group',
    });
    devGroup.attachInlinePolicy(devPolicy);
    // Group Users: Add users to group
    devGroup.addUser(devUser);

    // QC Policy: Define policy allow read s3 bucket (lab-iam-bucket) and lambda function (lab-iam-lambda)
    const qcPolicyStatement = new PolicyStatement({
      sid: 'AllowReadToQualityControlServices',
      effect: Effect.ALLOW,
      actions: ['s3:GetObject', 's3:ListBucket', 'lambda:ListFunctions', 'lambda:GetFunction'],
      resources: [labS3Bucket.bucketArn, `${labS3Bucket.bucketArn}/*`, labLambda.functionArn],
      // conditions: {
      //   BoolIfExists: {
      //     'aws:MultiFactorAuthPresent': 'true',
      //   },
      // },
    });
    const qcPolicy = new Policy(this, 'lab-iam-qc-policy', {
      policyName: 'labs-iam-qc-policy',
      statements: [qcPolicyStatement],
    });
    // QC User: Define user with QC policy
    const qcUser = new User(this, 'lab-qc-user', {
      userName: 'lab-qc-user',
    });
    qcUser.attachInlinePolicy(qcPolicy);
    new CfnOutput(this, 'lab-iam-qc-user-output', {
      key: 'labIamQcUser',
      value: qcUser.userName,
    });
    // QC Group: Define group with QC policy
    const qcGroup = new Group(this, 'lab-qc-group', {
      groupName: 'lab-qc-group',
    });
    qcGroup.attachInlinePolicy(qcPolicy);
    // Group Users: Add users to group
    qcGroup.addUser(qcUser);

    // Lambda Permissions: Allow lambda to write/read s3 bucket (lab-iam-bucket)
    const labLambdaS3PolicyStatement = new PolicyStatement({
      sid: 'AllowReadWriteToLabIamBucket',
      effect: Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [labS3Bucket.bucketArn, `${labS3Bucket.bucketArn}/*`],
    });
    const labLambdaS3Policy = new Policy(this, 'lab-iam-lambda-s3-policy', {
      policyName: 'lab-iam-lambda-s3-policy',
      statements: [labLambdaS3PolicyStatement],
    });

    const labLambdaS3Role = new Role(this, 'lab-iam-lambda-s3-role', {
      roleName: 'lab-iam-lambda-s3-role',
      description: 'Lab IAM Lambda S3 Role',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    labLambdaS3Role.attachInlinePolicy(labLambdaS3Policy);

    // Attach policy to lambda
    labLambda.role?.attachInlinePolicy(labLambdaS3Policy);

    // Account outside to access the bucket
    const iamReadOnlyAccessManagedPolicy =
      ManagedPolicy.fromAwsManagedPolicyName('IAMReadOnlyAccess');

    const iamReadOnlyAccessRole = new Role(this, 'lab-iam-readonly-role', {
      roleName: 'lab-iam-readonly-role',
      description: 'Lab IAM Read Only Role',
      assumedBy: new AccountPrincipal('339712732434'),
    });
    iamReadOnlyAccessRole.addManagedPolicy(iamReadOnlyAccessManagedPolicy);

    new CfnOutput(this, 'lab-iam-readonly-role-output', {
      key: 'labIamReadOnlyRole',
      value: iamReadOnlyAccessRole.roleName,
    });
  }
}
