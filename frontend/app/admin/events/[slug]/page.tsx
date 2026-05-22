import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminEventEditor } from "@/components/admin-event-editor";
import { isAdminEmail, safeAuth } from "@/auth";
import { isAuthBypassed } from "@/lib/auth-flags";
import { getEventBySlug, listComments } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export default async function AdminEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const bypassAuth = isAuthBypassed();
  const session = bypassAuth ? null : await safeAuth();

  if (!bypassAuth && !isAdminEmail(session?.user?.email)) {
    redirect("/");
  }

  const { slug } = await params;
  const event = await getEventBySlug(slug, true);

  if (!event) {
    notFound();
  }

  const comments = await listComments(event.slug);

  return (
    <main className="shell admin-shell">
      <SiteHeader />
      <div className="page admin-page">
        <AdminEventEditor event={event} comments={comments} />
      </div>
    </main>
  );
}
