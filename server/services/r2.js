import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

let client = null;

function getClient() {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY;
  const secretKey = process.env.R2_SECRET_KEY;
  const endpoint = process.env.R2_ENDPOINT || (accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : null);

  if (!endpoint || !accessKey || !secretKey) return null;

  client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  return client;
}

export function isConfigured() {
  return Boolean(getClient() && process.env.R2_BUCKET_NAME);
}

function contentTypeForExt(ext) {
  if (ext === 'mp3') return 'audio/mpeg';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'm4a') return 'audio/mp4';
  return 'video/mp4';
}

export async function uploadFile(localPath, key, { ext = 'mp4' } = {}) {
  const s3 = getClient();
  const bucket = process.env.R2_BUCKET_NAME;
  if (!s3 || !bucket) throw new Error('R2 is not configured');

  const fileStat = await stat(localPath);
  const body = createReadStream(localPath);

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentTypeForExt(ext),
    ContentLength: fileStat.size,
    Metadata: {
      'uploaded-by': 'vidinsecs',
    },
  }));

  return { key, size: fileStat.size };
}

export async function getDownloadUrl(key, filename) {
  const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
  if (publicBase) {
    return `${publicBase}/${key}`;
  }

  const s3 = getClient();
  const bucket = process.env.R2_BUCKET_NAME;
  const expiry = parseInt(process.env.R2_PRESIGN_EXPIRY || '3600', 10);

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
    { expiresIn: expiry },
  );

  return url;
}

export function buildObjectKey(filename) {
  const safe = filename.replace(/[^\w.\-]/g, '_').slice(0, 120);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return path.posix.join('downloads', id, safe);
}