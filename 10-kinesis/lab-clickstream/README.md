✅ Lab 1: Real-Time Clickstream Analytics for E-commerce (Node.js)

### 🔧 Goal:

Simulate user click events and stream them to Kinesis, process them in Lambda, and store them in S3 for analysis with Athena or QuickSight.

### 🧱 Architecture:

1. Node.js Script → sends fake clickstream data to

2. Kinesis Data Stream

3. Lambda Function → triggered by Kinesis, writes data to S3

4. S3 Bucket

5. Athena/QuickSight → for querying and visualization
