import { NextResponse, type NextRequest } from "next/server";
import { fetchBackend } from "@/lib/backend-service";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.eventSlug || !body?.path) {
    return NextResponse.json({ message: "Missing visit data" }, { status: 400 });
  }

  const payload = {
    eventSlug: body.eventSlug,
    sectionSlug: body.sectionSlug || "",
    path: body.path,
    referrer: body.referrer || request.headers.get("referer") || "",
    country: request.headers.get("x-vercel-ip-country") || "",
    region: request.headers.get("x-vercel-ip-country-region") || "",
    city: request.headers.get("x-vercel-ip-city") || "",
    userAgent: request.headers.get("user-agent") || ""
  };

  const response = await fetchBackend("/analytics/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return NextResponse.json({ message: "Visit not recorded" }, { status: response.status });
  }

  return NextResponse.json({ ok: true });
}
