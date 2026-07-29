import "server-only";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

export async function saveProductImage(file: File, slug: string) {
  const type = file.type;
  const ok =
    type === "image/jpeg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "image/gif";
  if (!ok) return { ok: false as const, message: "Gambar harus JPG, PNG, WEBP, atau GIF" };
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false as const, message: "Ukuran gambar maksimal 5 MB" };
  }

  const ext =
    type === "image/png"
      ? "png"
      : type === "image/webp"
        ? "webp"
        : type === "image/gif"
          ? "gif"
          : "jpg";

  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  const filename = `${slugify(slug) || "product"}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return { ok: true as const, path: `/uploads/products/${filename}` };
}

export async function adminGuard() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, message: auth.status === 401 ? "Unauthorized" : "Forbidden" },
        { status: auth.status },
      ),
    };
  }
  return { ok: true as const, user: auth.user };
}
