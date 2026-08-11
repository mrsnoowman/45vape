import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getLegacyUploadRoot, getUploadRoot } from "@/lib/upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

async function readFirst(paths: string[]) {
  for (const filePath of paths) {
    try {
      return await readFile(filePath);
    } catch {
      /* coba lokasi berikutnya */
    }
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const segments = (await ctx.params).path || [];
  if (
    !segments.length ||
    segments.some((part) => !part || part.includes("..") || part.includes("\\") || part.includes("/"))
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  const rel = path.join(...segments);
  const data = await readFirst([
    path.join(getUploadRoot(), rel),
    path.join(getLegacyUploadRoot(), rel),
  ]);

  if (!data) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(rel).toLowerCase();
  return new NextResponse(data, {
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
