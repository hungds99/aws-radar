# Start IAM with a hands-on lab

This is a hands-on lab that will guide you through the process of creating an IAM user, group, and policy. You will also learn how to attach the policy to the group and user.

## Prerequisites

- AWS account
- Three services are required to complete this lab:
  - IAM
  - S3
  - Lambda

## Requirements

Our company is developing a serverless application with an S3 bucket and a Lambda function. We need to define different access levels for various user groups:

**Users**:

- Developers:
  - Two developers (`lab-dev-user1` and `lab-dev-user2`) and one lead developer (`lab-dev-lead`).
- Quality Control (QC):
  - One quality control user (`lab-qc-user`).
- External Account:
  - One external account (`lab-outside-account`).

**Permissions**:

- Developers: Read/Write access to S3 bucket (lab-iam-bucket) and Lambda function (lab-iam-lambda). Lead developer can also update Lambda function configuration.
- QC User: Read/Write access to S3 bucket (lab-iam-bucket) and Invoke Lambda function (lab-iam-lambda).
- External Account: Read-only access to S3 bucket (lab-iam-bucket), Invoke Lambda function (lab-iam-lambda), and View IAM roles (limited information).

**Lambda Role Permissions**:

- Allow Lambda function to read/write S3 bucket (lab-iam-bucket).
