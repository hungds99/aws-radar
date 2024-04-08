# Start IAM with a hands-on lab

This is a hands-on lab that will guide you through the process of creating an IAM user, group, and policy. You will also learn how to attach the policy to the group and user.

## Prerequisites

- AWS account
- Three services are required to complete this lab:
  - IAM
  - S3
  - Lambda

## Requirements

We have root account. But I want to create a new user and group with the following permissions:

- Developer team: 3 members with 1 leader

  - All team should have read-write access to the S3 bucket and Lambda function.
  - The leader should have full access to the S3 bucket and Lambda function.

- QC team: 2 members with 1 leader

  - All team should have read-only access to the S3 bucket and Lambda function.
  - The leader should have full access to the S3 bucket.

- Lambda function should have access to read objects to the S3 bucket.

- Allow account outside can read-only in IAM. (ID: 123456789012)
