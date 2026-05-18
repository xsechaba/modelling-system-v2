// lib/s3.ts — S3 helpers for file upload, retrieval, and signed URL generation

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsConfig, S3_BUCKET } from './aws';

const s3 = new S3Client(awsConfig);

/**
 * Upload a file buffer to S3.
 * Returns the S3 key used to store the object.
 */
export async function uploadToS3(
  projectId: string,
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const key = `projects/${projectId}/${Date.now()}-${filename}`;

  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return key;
}

/**
 * Generate a pre-signed URL to download/view a file from S3.
 * The URL expires after `expiresIn` seconds (default 1 hour).
 */
export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Fetch the raw content of an S3 object as a Buffer.
 * Used server-side to re-read a previously uploaded file (e.g., for re-profiling).
 */
export async function downloadFromS3(key: string): Promise<Buffer> {
  const response = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Delete a file from S3.
 */
export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}
