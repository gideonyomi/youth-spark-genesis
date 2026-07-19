// Smart passport-photo processor.
// - Validates minimum resolution
// - Uses the browser's FaceDetector when available to center the crop on the face
//   (with headroom above so the head occupies the top ~55% of the frame).
// - Falls back to a centered crop biased toward the upper third (typical portrait).
// - Outputs a portrait 3:4 JPEG at up to 1200×1600, quality 0.92.

export type ProcessResult = {
  blob: Blob;
  file: File;
  dataUrl: string;
  width: number;
  height: number;
};

const TARGET_W = 1200;
const TARGET_H = 1600; // 3:4 portrait
const MIN_SHORT_EDGE = 400; // reject anything smaller than this on the short side
const HEAD_TOP_RATIO = 0.22; // ideal top of head sits ~22% down from the top of the frame

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

type Box = { x: number; y: number; width: number; height: number };

const detectFace = async (img: HTMLImageElement): Promise<Box | null> => {
  const FD = (window as any).FaceDetector;
  if (!FD) return null;
  try {
    const detector = new FD({ fastMode: true, maxDetectedFaces: 3 });
    const faces = await detector.detect(img);
    if (!faces?.length) return null;
    // Pick the largest face
    const best = faces.reduce((a: any, b: any) =>
      a.boundingBox.width * a.boundingBox.height >= b.boundingBox.width * b.boundingBox.height ? a : b,
    );
    const bb = best.boundingBox;
    return { x: bb.x, y: bb.y, width: bb.width, height: bb.height };
  } catch {
    return null;
  }
};

/**
 * Compute a source-space crop rect at 3:4 aspect containing the subject with
 * proper headroom. Falls back to a centered upper-biased crop when no face.
 */
const computeCrop = (imgW: number, imgH: number, face: Box | null): Box => {
  const aspect = 3 / 4;

  // We want the face height to be ~35% of the crop height (comfortable portrait).
  // From that, derive crop height, then width via aspect.
  let cropH: number;
  let cropW: number;
  let cx: number; // center x of crop
  let faceTop: number; // y of top of the head in source space (approx)

  if (face) {
    const faceH = face.height;
    cropH = Math.min(imgH, faceH / 0.35);
    cropW = cropH * aspect;
    cx = face.x + face.width / 2;
    // Approximate the top of the head as slightly above the detected bounding box
    faceTop = face.y - faceH * 0.15;
  } else {
    // No face — assume subject fills most of the frame, upper-biased.
    cropH = Math.min(imgH, imgW / aspect, imgH);
    cropW = cropH * aspect;
    if (cropW > imgW) {
      cropW = imgW;
      cropH = cropW / aspect;
    }
    cx = imgW / 2;
    faceTop = imgH * 0.15;
  }

  // Ensure crop fits inside source
  if (cropW > imgW) {
    cropW = imgW;
    cropH = cropW / aspect;
  }
  if (cropH > imgH) {
    cropH = imgH;
    cropW = cropH * aspect;
  }

  // Position vertically so that faceTop lands at HEAD_TOP_RATIO of cropH
  let y = faceTop - HEAD_TOP_RATIO * cropH;
  let x = cx - cropW / 2;

  // Clamp to image bounds
  x = Math.max(0, Math.min(imgW - cropW, x));
  y = Math.max(0, Math.min(imgH - cropH, y));

  return { x, y, width: cropW, height: cropH };
};

export const processPassportPhoto = async (file: File): Promise<ProcessResult> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file (JPG or PNG).");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Photo must be 5MB or less before processing.");
  }

  const originalUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await loadImage(originalUrl);
  } catch {
    URL.revokeObjectURL(originalUrl);
    throw new Error("Could not read that image. Please try a different photo.");
  }

  const minEdge = Math.min(img.naturalWidth, img.naturalHeight);
  if (minEdge < MIN_SHORT_EDGE) {
    URL.revokeObjectURL(originalUrl);
    throw new Error(
      `Photo is too small (${img.naturalWidth}×${img.naturalHeight}). Please upload a higher-resolution image — at least ${MIN_SHORT_EDGE}px on the short side.`,
    );
  }

  const face = await detectFace(img);
  const crop = computeCrop(img.naturalWidth, img.naturalHeight, face);

  // Downscale target if source crop is smaller than TARGET_W to avoid upscaling artifacts.
  const outW = Math.min(TARGET_W, Math.round(crop.width));
  const outH = Math.round(outW * (4 / 3));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, outW, outH);

  URL.revokeObjectURL(originalUrl);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encoding failed"))), "image/jpeg", 0.92),
  );

  if (blob.size > 3 * 1024 * 1024) {
    // Re-encode at lower quality if still above 3MB.
    const smaller: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encoding failed"))), "image/jpeg", 0.82),
    );
    return finalize(smaller, outW, outH);
  }
  return finalize(blob, outW, outH);
};

const finalize = (blob: Blob, width: number, height: number): ProcessResult => {
  const file = new File([blob], `passport-${Date.now()}.jpg`, { type: "image/jpeg" });
  const dataUrl = URL.createObjectURL(blob);
  return { blob, file, dataUrl, width, height };
};

export const FACE_DETECTION_AVAILABLE = typeof window !== "undefined" && !!(window as any).FaceDetector;
