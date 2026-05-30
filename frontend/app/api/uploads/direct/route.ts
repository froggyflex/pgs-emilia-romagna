import { NextResponse } from "next/server";
import { isAdminEmail, safeAuth } from "@/auth";
import { apiUrl } from "@/lib/api-url";
import { isAuthBypassed } from "@/lib/auth-flags";
import { createUploadToken } from "@/lib/upload-token";

export const runtime = "nodejs";

export async function POST() {
  const bypassAuth = isAuthBypassed();
  const session = bypassAuth ? null : await safeAuth();

  if (!bypassAuth && !isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ message: "Admin required" }, { status: 403 });
  }

  const token = createUploadToken(process.env.BACKEND_SERVICE_TOKEN);

  if (!token) {
    return NextResponse.json({ message: "Upload service token missing" }, { status: 500 });
  }

  return NextResponse.json({
    uploadUrl: apiUrl("/uploads"),
    token,
    maxSizeMb: Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB || process.env.MAX_UPLOAD_SIZE_MB || 750)
  });
}
