import sharp from "sharp";

const MAX_EDGE = 1920;
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 82;

export type OptimizedImage = {
  buffer: Buffer;
  mime: string;
  ext: string;
};

/**
 * Resize and recompress community post images before storage upload.
 * GIFs are passed through unchanged (animation + sharp edge cases).
 */
export async function optimizeUploadImage(buffer: Buffer, mime: string): Promise<OptimizedImage> {
  if (mime === "image/gif") {
    return { buffer, mime, ext: "gif" };
  }

  let pipeline = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await pipeline.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w > MAX_EDGE || h > MAX_EDGE) {
    pipeline = pipeline.resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true });
  }

  if (mime === "image/png") {
    const out = await pipeline.png({ compressionLevel: 9, effort: 7 }).toBuffer();
    return { buffer: out, mime: "image/png", ext: "png" };
  }
  if (mime === "image/webp") {
    const out = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
    return { buffer: out, mime: "image/webp", ext: "webp" };
  }

  const out = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  return { buffer: out, mime: "image/jpeg", ext: "jpg" };
}
