import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/uploads/")) return NextResponse.next();

  const rel = pathname.slice("/uploads/".length);
  if (!rel || rel.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = req.nextUrl.clone();
  url.pathname = `/api/media/${rel}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/uploads/:path*"],
};
