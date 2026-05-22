import sharp from "sharp";

const DEFAULT_MAX_EDGE = 1920;
const DEFAULT_JPEG_QUALITY = 82;
const DEFAULT_WEBP_QUALITY = 82;

export type OptimizedImage = {
  buffer: Buffer;
  mime: string;
  ext: string;
};

export type OptimizeUploadImageOptions = {
  /** Longest side in pixels; image is never upscaled. */
  maxEdge?: number;
  jpegQuality?: number;
  webpQuality?: number;
  /**
   * Opaque PNGs/JPEGs are stored as WebP for smaller files at similar visual quality.
   * PNGs with transparency stay PNG.
   */
  preferWebp?: boolean;
};

/**
 * Resize and recompress images before storage upload.
 * GIFs are passed through unchanged (animation + sharp edge cases).
 */
export async function optimizeUploadImage(
  buffer: Buffer,
  mime: string,
  options?: OptimizeUploadImageOptions,
): Promise<OptimizedImage> {
  if (mime === "image/gif") {
    return { buffer, mime, ext: "gif" };
  }

  const maxEdge = options?.maxEdge ?? DEFAULT_MAX_EDGE;
  const jpegQuality = options?.jpegQuality ?? DEFAULT_JPEG_QUALITY;
  const webpQuality = options?.webpQuality ?? DEFAULT_WEBP_QUALITY;
  const preferWebp = options?.preferWebp ?? false;

  const base = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const needsResize = w > maxEdge || h > maxEdge;

  let pipeline = base;
  if (needsResize) {
    pipeline = pipeline.resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true });
  }

  if (mime === "image/png") {
    const hasAlpha = meta.hasAlpha === true;
    if (hasAlpha) {
      const out = await pipeline.png({ compressionLevel: 9, effort: 7 }).toBuffer();
      return { buffer: out, mime: "image/png", ext: "png" };
    }
    if (preferWebp) {
      const out = await pipeline.webp({ quality: webpQuality, effort: 4 }).toBuffer();
      return { buffer: out, mime: "image/webp", ext: "webp" };
    }
    const out = await pipeline.png({ compressionLevel: 9, effort: 7 }).toBuffer();
    return { buffer: out, mime: "image/png", ext: "png" };
  }

  if (mime === "image/webp") {
    const out = await pipeline.webp({ quality: webpQuality, effort: 4 }).toBuffer();
    return { buffer: out, mime: "image/webp", ext: "webp" };
  }

  if (preferWebp) {
    const out = await pipeline.webp({ quality: webpQuality, effort: 4 }).toBuffer();
    return { buffer: out, mime: "image/webp", ext: "webp" };
  }

  const out = await pipeline.jpeg({ quality: jpegQuality, mozjpeg: true }).toBuffer();
  return { buffer: out, mime: "image/jpeg", ext: "jpg" };
}

/** Vendor logos — small display sizes; higher quality, keep transparency. */
export const VENDOR_LOGO_OPTIMIZE: OptimizeUploadImageOptions = {
  maxEdge: 512,
  jpegQuality: 88,
  webpQuality: 88,
  preferWebp: true,
};

/** Vendor product photos — marketplace cards; balance size and clarity. */
export const VENDOR_PRODUCT_OPTIMIZE: OptimizeUploadImageOptions = {
  maxEdge: 1600,
  jpegQuality: 85,
  webpQuality: 85,
  preferWebp: true,
};
