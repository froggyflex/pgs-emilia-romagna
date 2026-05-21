import { NextResponse } from "next/server";
import { auth, isAdminEmail } from "@/auth";
import { forwardBackendResponse, fetchBackend } from "@/lib/backend-service";
import { isAuthBypassed } from "@/lib/auth-flags";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = isAuthBypassed() ? null : await auth();

  if (!isAuthBypassed() && !isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const response = await fetchBackend("/uploads", {
    method: "POST",
    body: await request.formData()
  });

  return forwardBackendResponse(response);
}
