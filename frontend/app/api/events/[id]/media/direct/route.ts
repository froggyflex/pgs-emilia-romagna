import { NextResponse } from "next/server";
import { isAdminEmail, safeAuth } from "@/auth";
import { apiUrl } from "@/lib/api-url";
import { isAuthBypassed } from "@/lib/auth-flags";
import { createUploadToken } from "@/lib/upload-token";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bypassAuth = isAuthBypassed();
  const session = bypassAuth ? null : await safeAuth();

  if (!bypassAuth && !session?.user?.email) {
    return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  }

  if (!bypassAuth && !isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ message: "Admin required" }, { status: 403 });
  }

  const token = createUploadToken(process.env.BACKEND_SERVICE_TOKEN);

  if (!token) {
    return NextResponse.json({ message: "Upload service token missing" }, { status: 500 });
  }

  const { id } = await params;

  return NextResponse.json({
    uploadUrl: apiUrl(`/events/${encodeURIComponent(id)}/media`),
    token,
    authorName: session?.user?.name || session?.user?.email || "Admin test",
    authorEmail: session?.user?.email || "local-admin@example.com",
    authorImage: session?.user?.image || "",
    maxSizeMb: Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB || process.env.MAX_UPLOAD_SIZE_MB || 750)
  });
}
