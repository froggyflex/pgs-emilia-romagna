import { NextResponse } from "next/server";
import { auth, isAdminEmail } from "@/auth";
import { forwardBackendResponse, fetchBackend } from "@/lib/backend-service";
import { isAuthBypassed } from "@/lib/auth-flags";

export async function POST(request: Request) {
  const session = isAuthBypassed() ? null : await auth();

  if (!isAuthBypassed() && !isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const response = await fetchBackend("/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await request.json())
  });

  return forwardBackendResponse(response);
}
