import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { slugify } from "@/lib/slug";

export type UploadFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

/** Jangan pakai `instanceof File` — di Node/Next File undici ≠ File global. */
export function getFormFile(form: FormData, key: string): UploadFile | null {
  const value = form.get(key);
  if (!value || typeof value === "string") return null;

  const blob = value as Blob & { name?: string; type?: string };
  if (typeof blob.arrayBuffer !== "function") return null;
  const size = Number(blob.size || 0);
  if (!Number.isFinite(size) || size <= 0) return null;

  return {
    name: String(blob.name || key),
    type: String(blob.type || ""),
    size,
    arrayBuffer: () => blob.arrayBuffer(),
  };
}

function extFromName(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!match) return null;
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  return IMAGE_EXTS.has(ext) ? ext : null;
}

function extFromType(type: string) {
  const normalized = type.toLowerCase().split(";")[0].trim();
  if (normalized === "image/png" || normalized === "image/x-png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/gif") return "gif";
  if (
    normalized === "image/jpeg" ||
    normalized === "image/jpg" ||
    normalized === "image/pjpeg"
  ) {
    return "jpg";
  }
  return null;
}

export async function savePublicImage(
  file: UploadFile,
  folder: "products" | "payment-proofs",
  basename: string,
  maxBytes = 5 * 1024 * 1024,
) {
  const ext = extFromType(file.type) || extFromName(file.name);
  if (!ext) {
    return {
      ok: false as const,
      message: "Gambar harus JPG, PNG, WEBP, atau GIF",
    };
  }
  if (file.size > maxBytes) {
    return {
      ok: false as const,
      message: `Ukuran gambar maksimal ${Math.round(maxBytes / 1024 / 1024)} MB`,
    };
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const filename = `${slugify(basename) || folder}-${Date.now()}.${ext}`;
  const dest = path.join(dir, filename);
  await writeFile(dest, Buffer.from(await file.arrayBuffer()));
  return { ok: true as const, path: `/uploads/${folder}/${filename}` };
}
