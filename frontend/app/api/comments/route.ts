import { NextResponse } from "next/server";
import { safeAuth } from "@/auth";
import { forwardBackendResponse, fetchBackend } from "@/lib/backend-service";
import { isAuthBypassed } from "@/lib/auth-flags";

export async function POST(request: Request) {
  const bypassAuth = isAuthBypassed();
  const session = bypassAuth ? null : await safeAuth();

  if (!bypassAuth && !session?.user?.email) {
    return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  }

  const body = await request.json();
  const response = await fetchBackend("/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      ...(session?.user ? {
        authorName: session.user.name || session.user.email,
        authorEmail: session.user.email,
        authorImage: session.user.image || undefined
      } : {})
    })
  });

  return forwardBackendResponse(response);
}
