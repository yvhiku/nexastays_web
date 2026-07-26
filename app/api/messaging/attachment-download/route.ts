import { NextRequest, NextResponse } from "next/server";
import { getStaysApiBaseUrl } from "@/lib/env";

function isAllowedAttachmentUrl(url: string): boolean {
  try {
    const base = new URL(`${getStaysApiBaseUrl().replace(/\/$/, "")}/`);
    const candidate = new URL(url);
    const attachmentPath = `${base.pathname.replace(/\/$/, "")}/messaging/media/attachments/`;
    return (
      candidate.origin === base.origin &&
      !candidate.username &&
      !candidate.password &&
      candidate.pathname.startsWith(attachmentPath)
    );
  } catch {
    return false;
  }
}

const MAX_ATTACHMENT_BYTES = 30 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") ?? "nexa-attachment.jpg";

  if (!rawUrl || !isAllowedAttachmentUrl(rawUrl)) {
    return NextResponse.json({ error: "Invalid attachment URL" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(rawUrl, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return NextResponse.json({ error: "Attachment unavailable" }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json({ error: "Attachment unavailable" }, { status: upstream.status });
  }

  const declaredSize = Number(upstream.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json({ error: "Attachment is too large" }, { status: 413 });
  }
  const buffer = await upstream.arrayBuffer();
  if (buffer.byteLength > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json({ error: "Attachment is too large" }, { status: 413 });
  }
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
