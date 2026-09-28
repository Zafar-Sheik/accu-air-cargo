import { AwsClient } from "aws4fetch";
import { randomUUID } from "node:crypto";
import { HttpError } from "./http";
export async function uploadImage(req: Request) {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_PUBLIC_URL,
  } = process.env;
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET ||
    !R2_PUBLIC_URL
  )
    throw new HttpError(503, "Image storage has not been configured.");
  const size = Number(req.headers.get("content-length"));
  if (!size || size > 3 * 1024 * 1024)
    throw new HttpError(413, "Choose an image smaller than 3 MB.");
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length > 3 * 1024 * 1024)
    throw new HttpError(413, "Image too large");
  const hex = Buffer.from(bytes.slice(0, 12)).toString("hex");
  let type = "",
    ext = "";
  if (hex.startsWith("89504e470d0a1a0a")) {
    type = "image/png";
    ext = "png";
  } else if (hex.startsWith("ffd8ff")) {
    type = "image/jpeg";
    ext = "jpg";
  } else if (
    hex.startsWith("52494646") &&
    Buffer.from(bytes.slice(8, 12)).toString() === "WEBP"
  ) {
    type = "image/webp";
    ext = "webp";
  } else
    throw new HttpError(400, "Only PNG, JPEG and WebP images are supported.");
  const key = `products/${randomUUID()}.${ext}`;
  const client = new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
  const response = await client.fetch(
    `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${encodeURIComponent(R2_BUCKET)}/${key}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": type,
        "Cache-Control": "public,max-age=31536000,immutable",
      },
      body: bytes,
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok)
    throw new HttpError(503, "The image could not be uploaded.");
  return { url: `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}` };
}
