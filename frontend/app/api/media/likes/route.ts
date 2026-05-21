import { forwardBackendResponse, fetchBackend } from "@/lib/backend-service";

export async function POST(request: Request) {
  const response = await fetchBackend("/media/likes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await request.json())
  });

  return forwardBackendResponse(response);
}
