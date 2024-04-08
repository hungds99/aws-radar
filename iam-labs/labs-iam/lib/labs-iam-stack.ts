import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  ArnPrincipal,
  CompositePrincipal,
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

    /* -------- Create service resource -------- */
    // S3 Bucket
    const labS3Bucket = new Bucket(this, 'lab-iam-bucket', {
      bucketName: 'lab-iam-bucket',
      removalPolicy: RemovalPolicy.DESTROY,
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
    /* -------------------------------------- */

    /* -------- Create IAM resources -------- */
    /* Developer:
     * - 2 developers (lab-dev-user1, lab-dev-user2) and 1 lead developer (lab-dev-lead)
     * - Developers have permissions to read/write S3 bucket (lab-iam-bucket) and read/write lambda function (lab-iam-lambda)
     * - A leader has the same permissions as developers and can update the configuration of the lambda function
     */
    const labDevPolicyStatement = new PolicyStatement({
      sid: 'AllowReadWriteToDevelopmentServices',
      effect: Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:GetObject',
        's3:ListBucket',
        'lambda:InvokeFunction',
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
    const labDevPolicy = new Policy(this, 'lab-dev-policy', {
      policyName: 'lab-dev-policy',
      statements: [labDevPolicyStatement],
    });
    const labDevLeadPolicyStatement = new PolicyStatement({
      sid: 'AllowUpdateLambdaConfiguration',
      effect: Effect.ALLOW,
      actions: ['lambda:UpdateFunctionConfiguration'],
      resources: [labLambda.functionArn],
    });
    const labDevLeadPolicy = new Policy(this, 'lab-dev-lead-policy', {
      policyName: 'lab-dev-lead-policy',
      statements: [labDevLeadPolicyStatement],
    });
    const labDevUser1 = new User(this, 'lab-dev-user1', {
      userName: 'lab-dev-user1',
    });
    const labDevUser2 = new User(this, 'lab-dev-user2', {
      userName: 'lab-dev-user2',
    });
    const labDevLead = new User(this, 'lab-dev-lead', {
      userName: 'lab-dev-lead',
    });
    labDevLead.attachInlinePolicy(labDevLeadPolicy);
    const labDevGroup = new Group(this, 'lab-dev-group', {
      groupName: 'lab-dev-group',
    });
    labDevGroup.attachInlinePolicy(labDevPolicy);
    labDevGroup.addUser(labDevUser1);
    labDevGroup.addUser(labDevUser2);
    labDevGroup.addUser(labDevLead);

    /* Quality Control:
     * - 1 quality control user (lab-qc-user)
     * - QC user has permissions to read/write S3 bucket (lab-iam-bucket) and invoke lambda function (lab-iam-lambda)
     */
    const labQCPolicyStatement = new PolicyStatement({
      sid: 'AllowReadToQualityControlServices',
      effect: Effect.ALLOW,
      actions: ['s3:GetObject', 's3:PutObject', 'lambda:GetFunction', 'lambda:InvokeFunction'],
      resources: [labS3Bucket.bucketArn, `${labS3Bucket.bucketArn}/*`, labLambda.functionArn],
      // conditions: {
      //   BoolIfExists: {
      //     'aws:MultiFactorAuthPresent': 'true',
      //   },
      // },
    });
    const labQCPolicy = new Policy(this, 'lab-qc-policy', {
      policyName: 'lab-qc-policy',
      statements: [labQCPolicyStatement],
    });
    const labQCUser = new User(this, 'lab-qc-user', {
      userName: 'lab-qc-user',
    });
    const labQCGroup = new Group(this, 'lab-qc-group', {
      groupName: 'lab-qc-group',
    });
    labQCGroup.attachInlinePolicy(labQCPolicy);
    labQCGroup.addUser(labQCUser);

    /* Lambda Permissions:
     * - Allow lambda to read/write s3 bucket (lab-iam-bucket)
     */
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
    labLambda.role?.attachInlinePolicy(labLambdaS3Policy);

    /* Account outside:
     * - 1 account outside (lab-outside-account)
     * - Account outside has permissions to read S3 bucket (lab-iam-bucket), invoke lambda function (lab-iam-lambda) and read IAM role
     */
    const labOutsideUser = new User(this, 'lab-outside-user', {
      userName: 'lab-outside-user',
    });

    const labOutsidePolicyStatement = new PolicyStatement({
      sid: 'AllowReadToOutsideAccountServices',
      effect: Effect.ALLOW,
      actions: ['s3:GetObject', 'lambda:GetFunction', 'lambda:InvokeFunction'],
      resources: [labS3Bucket.bucketArn, `${labS3Bucket.bucketArn}/*`, labLambda.functionArn],
      // conditions: {
      //   BoolIfExists: {
      //     'aws:MultiFactorAuthPresent': 'true',
      //   },
      // },
    });
    const labOutsidePolicy = new Policy(this, 'lab-outside-policy', {
      policyName: 'lab-outside-policy',
      statements: [labOutsidePolicyStatement],
    });

    const labIamReadOnlyAccessManagedPolicy =
      ManagedPolicy.fromAwsManagedPolicyName('IAMReadOnlyAccess');

    const iamReadOnlyAccessRole = new Role(this, 'lab-iam-readonly-role', {
      roleName: 'lab-iam-readonly-role',
      description: 'Lab IAM Read Only Role',
      assumedBy: new CompositePrincipal(new ArnPrincipal(labOutsideUser.userArn)),
    });
    iamReadOnlyAccessRole.addManagedPolicy(labIamReadOnlyAccessManagedPolicy);
    iamReadOnlyAccessRole.attachInlinePolicy(labOutsidePolicy);
  }
}
