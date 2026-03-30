import path from "path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const getRequiredEnv = (name) => {
  const value = process.env[name];
  const normalized = value ? value.trim() : "";
  if (!normalized) {
    const error = new Error(`${name} is not configured.`);
    error.status = 500;
    throw error;
  }
  return normalized;
};

const getOptionalEnv = (name) => {
  const value = process.env[name];
  return value ? value.trim() : "";
};

const hasS3Config = () =>
  Boolean(
    getOptionalEnv("AWS_ACCESS_KEY_ID") &&
      getOptionalEnv("AWS_SECRET_ACCESS_KEY") &&
      getOptionalEnv("AWS_REGION") &&
      getOptionalEnv("AWS_S3_BUCKET")
  );

const buildS3Client = () =>
  new S3Client({
    region: getRequiredEnv("AWS_REGION"),
    credentials: {
      accessKeyId: getRequiredEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("AWS_SECRET_ACCESS_KEY"),
    },
  });

const s3Client = hasS3Config() ? buildS3Client() : null;

const safeName = (value) => (value || "upload").replace(/[^a-zA-Z0-9._-]/g, "_");

const resolvePublicBaseUrl = () => {
  const override = getOptionalEnv("AWS_S3_PUBLIC_BASE_URL");
  if (override) return override.replace(/\/$/, "");
  const bucket = getRequiredEnv("AWS_S3_BUCKET");
  const region = getRequiredEnv("AWS_REGION");
  return `https://${bucket}.s3.${region}.amazonaws.com`;
};

const resolveKey = ({ folder, originalName }) => {
  const ext = path.extname(originalName || "");
  const baseName = path.basename(originalName || "upload", ext);
  const rand = Math.random().toString(36).slice(2, 8);
  const prefix = (folder || "uploads").replace(/^\/+|\/+$/g, "");
  return `${prefix}/${Date.now()}-${rand}-${safeName(baseName)}${ext}`;
};

const uploadBufferToS3 = async ({ buffer, contentType, originalName, folder }) => {
  if (!hasS3Config() || !s3Client) {
    const error = new Error(
      "AWS S3 is not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET."
    );
    error.status = 500;
    throw error;
  }

  const bucket = getRequiredEnv("AWS_S3_BUCKET");
  const key = resolveKey({ folder, originalName });
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
    })
  );

  const url = `${resolvePublicBaseUrl()}/${key}`;
  return { key, url };
};

const getS3KeyFromValue = (value) => {
  const text = (value || "").toString().trim();
  if (!text) return "";

  if (/^https?:\/\//i.test(text)) {
    try {
      const parsed = new URL(text);
      return parsed.pathname.replace(/^\/+/, "");
    } catch {
      return "";
    }
  }

  return text.replace(/^\/+/, "");
};

const getSignedObjectUrl = async (value, expiresIn = 3600) => {
  const raw = (value || "").toString().trim();
  if (!raw || !hasS3Config() || !s3Client) return raw;
  if (/x-amz-signature=/i.test(raw)) return raw;

  const key = getS3KeyFromValue(raw);
  if (!key) return raw;

  const bucket = getRequiredEnv("AWS_S3_BUCKET");
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn }
  );
};

export { getSignedObjectUrl, getS3KeyFromValue, hasS3Config, uploadBufferToS3 };
