import { NextResponse } from "next/server";
import { safeAuth } from "@/auth";
import { fetchBackend, forwardBackendResponse } from "@/lib/backend-service";
import { isAuthBypassed } from "@/lib/auth-flags";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const bypassAuth = isAuthBypassed();
  const session = bypassAuth ? null : await safeAuth();

  if (!bypassAuth && !session?.user?.email) {
    return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  formData.set("authorName", session?.user?.name || session?.user?.email || "Admin test");
  formData.set("authorEmail", session?.user?.email || "local-admin@example.com");

  if (session?.user?.image) {
    formData.set("authorImage", session.user.image);
  }

  const response = await fetchBackend(`/events/${encodeURIComponent(id)}/media`, {
    method: "POST",
    body: formData
  });

  return forwardBackendResponse(response);
}
