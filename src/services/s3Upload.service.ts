import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Configure AWS S3 Client (v3)
const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
  }
});

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  key: string;
}

export const uploadFileToS3 = async (
  file: File,
  folder: string = 'uploads',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  const bucketName = import.meta.env.VITE_AWS_S3_BUCKET;
  const region = import.meta.env.VITE_AWS_REGION;

  if (!bucketName) {
    throw new Error('S3 bucket name not configured');
  }

  if (!region) {
    throw new Error('AWS region not configured');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop();
  const key = `${folder}/${timestamp}-${randomString}.${extension}`;

  try {
    // Simulate progress for better UX (since AWS SDK v3 doesn't support progress in browsers)
    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, percentage: 0 });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        onProgress({ loaded: file.size * 0.5, total: file.size, percentage: 50 });
      }, 100);

      setTimeout(() => {
        clearInterval(progressInterval);
      }, 500);
    }

    // Convert File to ArrayBuffer for browser compatibility
    const arrayBuffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type
    });

    await s3Client.send(command);

    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    // Complete progress
    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }

    return {
      url,
      key
    };
  } catch (error) {
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteFileFromS3 = async (key: string): Promise<void> => {
  const bucketName = import.meta.env.VITE_AWS_S3_BUCKET;

  if (!bucketName) {
    throw new Error('S3 bucket name not configured');
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    await s3Client.send(command);
  } catch (error) {
    throw new Error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
