import { NextResponse } from "next/server";
import { isAdminEmail, safeAuth } from "@/auth";
import { forwardBackendResponse, fetchBackend } from "@/lib/backend-service";
import { isAuthBypassed } from "@/lib/auth-flags";

export async function GET(request: Request) {
  const session = isAuthBypassed() ? null : await safeAuth();

  if (!isAuthBypassed() && !isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const eventSlug = url.searchParams.get("eventSlug") || "";

  if (!eventSlug) {
    return NextResponse.json({ message: "Missing eventSlug" }, { status: 400 });
  }

  const response = await fetchBackend(`/analytics?eventSlug=${encodeURIComponent(eventSlug)}`);
  return forwardBackendResponse(response);
}
