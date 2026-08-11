import "server-only";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { savePublicImage, type UploadFile } from "@/lib/upload";

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

export async function saveProductImage(file: UploadFile, slug: string) {
  return savePublicImage(file, "products", slug);
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
