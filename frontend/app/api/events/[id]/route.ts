import { NextResponse } from "next/server";
import { isAdminEmail, safeAuth } from "@/auth";
import { forwardBackendResponse, fetchBackend } from "@/lib/backend-service";
import { isAuthBypassed } from "@/lib/auth-flags";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = isAuthBypassed() ? null : await safeAuth();

  if (!isAuthBypassed() && !isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const response = await fetchBackend(`/events/${encodeURIComponent(id)}`, { method: "DELETE" });
  return forwardBackendResponse(response);
}
