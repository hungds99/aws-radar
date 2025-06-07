# AWS IAM Labs - Real-world Project Scenarios

## Introduction

These labs provide hands-on experience with AWS Identity and Access Management (IAM) in the context of real-world project scenarios. You'll learn how to implement secure access controls, manage permissions, and follow AWS security best practices.

## Prerequisites

- AWS account with administrator access
- AWS CLI installed and configured
- Basic understanding of AWS services
- AWS Management Console access

## Lab 1: Setting Up a Multi-tier Web Application Team Structure

### Scenario

You're starting a new web application project with three teams:

- **Frontend Team**: Needs access to CloudFront, S3, and Route53
- **Backend Team**: Requires access to Lambda, API Gateway, and DynamoDB
- **DevOps Team**: Needs broader permissions to set up CI/CD pipelines and monitoring

### Tasks

1. Create appropriate IAM groups for each team
2. Create custom IAM policies that follow the principle of least privilege
3. Create IAM users and assign them to appropriate groups
4. Test access permissions

### Implementation

#### 1. Create the IAM Groups

```bash
# Create groups for each team
aws iam create-group --group-name FrontendTeam
aws iam create-group --group-name BackendTeam
aws iam create-group --group-name DevOpsTeam
```

#### 2. Create Custom IAM Policies

**Frontend Team Policy:**

```bash
cat > frontend-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket",
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution",
        "route53:GetHostedZone",
        "route53:ListResourceRecordSets"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
EOF

aws iam create-policy --policy-name FrontendTeamPolicy --policy-document file://frontend-policy.json
```

**Backend Team Policy:**

```bash
cat > backend-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:GetFunction",
        "lambda:UpdateFunctionCode",
        "lambda:InvokeFunction",
        "apigateway:GET",
        "apigateway:PUT",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
EOF

aws iam create-policy --policy-name BackendTeamPolicy --policy-document file://backend-policy.json
```

**DevOps Team Policy:**

```bash
cat > devops-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "cloudwatch:*",
        "logs:*",
        "cloudformation:*",
        "codebuild:*",
        "codedeploy:*",
        "codepipeline:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::*:role/deployment-*",
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": [
            "cloudformation.amazonaws.com",
            "codedeploy.amazonaws.com"
          ]
        }
      }
    }
  ]
}
EOF

aws iam create-policy --policy-name DevOpsTeamPolicy --policy-document file://devops-policy.json
```

#### 3. Attach Policies to Groups

```bash
# Get the ARNs for the policies (replace with actual ARNs)
FRONTEND_POLICY_ARN=$(aws iam list-policies --query 'Policies[?PolicyName==`FrontendTeamPolicy`].Arn' --output text)
BACKEND_POLICY_ARN=$(aws iam list-policies --query 'Policies[?PolicyName==`BackendTeamPolicy`].Arn' --output text)
DEVOPS_POLICY_ARN=$(aws iam list-policies --query 'Policies[?PolicyName==`DevOpsTeamPolicy`].Arn' --output text)

# Attach policies to groups
aws iam attach-group-policy --group-name FrontendTeam --policy-arn $FRONTEND_POLICY_ARN
aws iam attach-group-policy --group-name BackendTeam --policy-arn $BACKEND_POLICY_ARN
aws iam attach-group-policy --group-name DevOpsTeam --policy-arn $DEVOPS_POLICY_ARN
```

#### 4. Create IAM Users and Add to Groups

```bash
# Create users
aws iam create-user --user-name frontend-developer
aws iam create-user --user-name backend-developer
aws iam create-user --user-name devops-engineer

# Create console access for users (replace with secure passwords)
aws iam create-login-profile --user-name frontend-developer --password "SecurePassword1!" --password-reset-required
aws iam create-login-profile --user-name backend-developer --password "SecurePassword2!" --password-reset-required
aws iam create-login-profile --user-name devops-engineer --password "SecurePassword3!" --password-reset-required

# Add users to groups
aws iam add-user-to-group --user-name frontend-developer --group-name FrontendTeam
aws iam add-user-to-group --user-name backend-developer --group-name BackendTeam
aws iam add-user-to-group --user-name devops-engineer --group-name DevOpsTeam
```

### Verification

1. Login as each user and verify they can access only their permitted services
2. Check that the frontend developer can work with S3 but not Lambda
3. Confirm the backend developer can access DynamoDB but not CloudFront

## Lab 2: Implementing a Cross-Account Access Strategy

### Scenario

Your organization has separate AWS accounts for development, staging, and production environments. DevOps team members need to access resources across these accounts to deploy and maintain the application.

### Tasks

1. Set up IAM roles in each target account (staging, production)
2. Configure trust relationships to allow access from the development account
3. Use role assumption to perform cross-account operations
4. Implement and test session policies

### Implementation

#### 1. Create Cross-Account Roles (in staging and production accounts)

**In the Staging Account Console:**

1. Navigate to IAM > Roles > Create Role
2. Select "Another AWS account"
3. Enter your Development account ID
4. Attach the necessary permissions policies
5. Name the role "DevOpsCrossAccountRole-Staging"

**Production Account (via CLI):**

```bash
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::DEVELOPMENT_ACCOUNT_ID:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "UniqueExternalId123"
        }
      }
    }
  ]
}
EOF

# Replace DEVELOPMENT_ACCOUNT_ID with your actual ID
aws iam create-role --role-name DevOpsCrossAccountRole-Production --assume-role-policy-document file://trust-policy.json
aws iam attach-role-policy --role-name DevOpsCrossAccountRole-Production --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
```

#### 2. Create a Policy in the Development Account to Allow Role Assumption

```bash
cat > assume-role-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": [
        "arn:aws:iam::STAGING_ACCOUNT_ID:role/DevOpsCrossAccountRole-Staging",
        "arn:aws:iam::PRODUCTION_ACCOUNT_ID:role/DevOpsCrossAccountRole-Production"
      ]
    }
  ]
}
EOF

# Replace with actual account IDs
aws iam create-policy --policy-name CrossAccountAssumeRolePolicy --policy-document file://assume-role-policy.json
aws iam attach-user-policy --user-name devops-engineer --policy-arn $(aws iam list-policies --query 'Policies[?PolicyName==`CrossAccountAssumeRolePolicy`].Arn' --output text)
```

#### 3. Demonstrate Role Assumption

```bash
# Assuming a role in the staging account
aws sts assume-role --role-arn "arn:aws:iam::STAGING_ACCOUNT_ID:role/DevOpsCrossAccountRole-Staging" --role-session-name "CrossAccountSession" --external-id "UniqueExternalId123"

# Use the returned credentials to perform actions in the staging account
export AWS_ACCESS_KEY_ID="returned_access_key"
export AWS_SECRET_ACCESS_KEY="returned_secret_key"
export AWS_SESSION_TOKEN="returned_session_token"

# Now commands will execute in the context of the staging account
aws s3 ls
```

### Verification

1. Confirm that the devops-engineer user can successfully assume roles in other accounts
2. Verify that appropriate permissions are available after role assumption
3. Test that access is properly limited based on the role policies

## Lab 3: Securing API Access with IAM Roles for Service Accounts

### Scenario

Your application runs on Kubernetes and needs to interact with AWS services like S3 and DynamoDB without using long-term credentials.

### Tasks

1. Create an IAM OIDC provider for your Kubernetes cluster
2. Set up IAM roles for service accounts
3. Configure a Kubernetes service account to use IAM roles
4. Deploy and test an application using this setup

### Implementation

#### 1. Set Up OIDC Provider for Your EKS Cluster

```bash
# Get your EKS cluster OIDC provider URL
OIDC_PROVIDER=$(aws eks describe-cluster --name your-cluster-name --query "cluster.identity.oidc.issuer" --output text | sed -e "s/^https:\/\///")

# Create the IAM OIDC provider
aws iam create-open-id-connect-provider \
   --url https://$OIDC_PROVIDER \
   --client-id-list sts.amazonaws.com \
   --thumbprint-list $(echo | openssl s_client -servername $OIDC_PROVIDER -showcerts -connect $OIDC_PROVIDER:443 2>/dev/null | openssl x509 -fingerprint -sha1 -noout | sed 's/://g' | sed 's/.*=//g')
```

#### 2. Create IAM Role for Kubernetes Service Account

```bash
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/OIDC_PROVIDER"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "OIDC_PROVIDER:sub": "system:serviceaccount:default:s3-reader",
          "OIDC_PROVIDER:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
EOF

# Replace ACCOUNT_ID and OIDC_PROVIDER with actual values
aws iam create-role --role-name s3-reader-role --assume-role-policy-document file://trust-policy.json
aws iam attach-role-policy --role-name s3-reader-role --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
```

#### 3. Create Kubernetes Service Account

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: s3-reader
  namespace: default
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT_ID:role/s3-reader-role
```

#### 4. Deploy and Test a Pod Using the Service Account

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: aws-cli
spec:
  serviceAccountName: s3-reader
  containers:
    - name: aws-cli
      image: amazon/aws-cli
      command: ['sleep', '3600']
```

### Verification

1. Exec into the pod and run AWS commands:

```bash
kubectl exec -it aws-cli -- aws s3 ls
```

2. Verify that the pod can access S3 without explicit credentials
3. Try accessing a different service to confirm permissions are properly limited

## Lab 4: Implementing AWS IAM Access Analyzer

### Scenario

You need to audit your AWS environment for potential external access and unused permissions.

### Tasks

1. Set up IAM Access Analyzer
2. Analyze findings and remediate issues
3. Implement a least privilege strategy based on analyzer results

### Implementation

#### 1. Enable IAM Access Analyzer

```bash
aws accessanalyzer create-analyzer \
    --analyzer-name organization-analyzer \
    --type ORGANIZATION
```

#### 2. Check for External Access Findings

```bash
aws accessanalyzer list-findings --analyzer-name organization-analyzer

# Filter for only S3-related findings
aws accessanalyzer list-findings \
    --analyzer-name organization-analyzer \
    --filter '{"resourceType": {"eq": ["AWS::S3::Bucket"]}}'
```

#### 3. Generate and Review Access Reports for IAM Entities

```bash
# Generate a service access report for a role
aws accessanalyzer start-resource-scan --analyzer-name organization-analyzer \
    --resource-arn arn:aws:iam::ACCOUNT_ID:role/DevOpsTeamRole

# After a few minutes, check the results
aws accessanalyzer list-findings --analyzer-name organization-analyzer \
    --filter '{"resource": {"eq": ["arn:aws:iam::ACCOUNT_ID:role/DevOpsTeamRole"]}}'
```

### Verification

1. Review Access Analyzer findings in the console
2. Address any S3 buckets with external access
3. Use findings to refine IAM policies based on actual service usage

## Lab 5: Creating and Using IAM Permission Boundaries

### Scenario

Your organization is expanding and allowing project leads to create IAM users and roles for their teams, but you need to ensure they can't grant excessive permissions.

### Tasks

1. Create a permission boundary to limit what permissions can be granted
2. Apply the boundary to delegated IAM administrators
3. Test the boundary effectiveness

### Implementation

#### 1. Create a Permission Boundary Policy

```bash
cat > permission-boundary.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "dynamodb:*",
        "lambda:*",
        "cloudwatch:*",
        "logs:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Action": [
        "iam:CreateUser",
        "iam:DeleteUser",
        "iam:AttachUserPolicy",
        "iam:DetachUserPolicy",
        "iam:DeleteRolePolicy",
        "organizations:*",
        "ec2:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam create-policy --policy-name ProjectTeamBoundary --policy-document file://permission-boundary.json
BOUNDARY_POLICY_ARN=$(aws iam list-policies --query 'Policies[?PolicyName==`ProjectTeamBoundary`].Arn' --output text)
```

#### 2. Create a Role for Team Leads with IAM Admin Access but with the Permission Boundary

```bash
cat > team-lead-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "iam:*",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:PutRolePermissionsBoundary",
        "iam:CreateUser",
        "iam:PutUserPermissionsBoundary"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "iam:PermissionsBoundary": "BOUNDARY_POLICY_ARN"
        }
      }
    }
  ]
}
EOF

# Replace with actual boundary ARN
sed -i "s|BOUNDARY_POLICY_ARN|$BOUNDARY_POLICY_ARN|g" team-lead-policy.json

aws iam create-policy --policy-name TeamLeadIAMPolicy --policy-document file://team-lead-policy.json
aws iam create-user --user-name team-lead
aws iam attach-user-policy --user-name team-lead --policy-arn $(aws iam list-policies --query 'Policies[?PolicyName==`TeamLeadIAMPolicy`].Arn' --output text)
aws iam put-user-permissions-boundary --user-name team-lead --permissions-boundary $BOUNDARY_POLICY_ARN
```

### Verification

1. Login as the team-lead user
2. Try to create a user with full admin permissions (should fail)
3. Create a role with S3 and DynamoDB permissions (should succeed)
4. Try to create a role with EC2 permissions (should fail)

## Best Practices Summary

1. **Principle of Least Privilege**: Grant only the permissions required to perform a task
2. **Use Groups and Roles**: Manage permissions through IAM groups and roles rather than individual users
3. **Regular Audits**: Use IAM Access Analyzer to regularly audit your permissions
4. **Avoid Long-term Credentials**: Use IAM roles and temporary credentials where possible
5. **Enable MFA**: Require multi-factor authentication for all users
6. **Use Permission Boundaries**: Delegate permissions safely using permission boundaries
7. **Implement Conditions**: Use policy conditions to restrict access by IP, time, MFA status, etc.
8. **Don't Share Credentials**: Never share access keys or credentials between users
9. **Rotate Credentials**: Regularly rotate all access keys and credentials
10. **Monitor Activity**: Use CloudTrail to monitor IAM and AWS account activity

## Conclusion

These labs provide practical experience with AWS IAM in real-world project scenarios. By completing these exercises, you'll gain a better understanding of how to implement a secure and efficient access management strategy for your AWS environments.
