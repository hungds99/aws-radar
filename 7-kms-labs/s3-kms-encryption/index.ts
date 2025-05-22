import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'node:fs';

async function uploadFileToS3(bucketName: string, filePath: string) {
  const s3 = new S3Client({ region: 'ap-southeast-1' });

  // Read file content instead of using a stream
  const fileContent = fs.readFileSync(filePath);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: `s3-kms-encryption/${filePath.split('/').pop()}`,
    Body: fileContent,
    ServerSideEncryption: 'aws:kms',
    ContentLength: fs.statSync(filePath).size,
  });

  try {
    const response = await s3.send(command);
    console.log('File uploaded successfully:', response);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

uploadFileToS3('lab-aws-radar', './encrypted-file.txt');
