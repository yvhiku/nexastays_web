import { NextRequest, NextResponse } from "next/server";
import { getStaysApiBaseUrl } from "@/lib/env";

function isAllowedAttachmentUrl(url: string): boolean {
  try {
    const base = getStaysApiBaseUrl().replace(/\/$/, "");
    return url.startsWith(`${base}/messaging/media/attachments/`);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") ?? "nexa-attachment.jpg";

  if (!rawUrl || !isAllowedAttachmentUrl(rawUrl)) {
    return NextResponse.json({ error: "Invalid attachment URL" }, { status: 400 });
  }

  const upstream = await fetch(rawUrl, { cache: "no-store" });
  if (!upstream.ok) {
    return NextResponse.json({ error: "Attachment unavailable" }, { status: upstream.status });
  }

  const buffer = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const safeFilename = filename.replace(/[^\w.\-()+\s]/g, "_").slice(0, 180);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
