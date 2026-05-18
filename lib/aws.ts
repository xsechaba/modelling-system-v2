// lib/aws.ts — Shared AWS configuration
// Every AWS service in the app imports its credentials from here.

export const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

export const S3_BUCKET = process.env.S3_BUCKET_NAME || 'dim-wiz-uploads';
