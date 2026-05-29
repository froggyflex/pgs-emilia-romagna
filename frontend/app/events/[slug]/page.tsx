import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { EventPublicView, EventUnavailableView } from "@/components/EventPublicView";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { getEventBySlug, listComments } from "@/lib/backend-api";
import { safeAuth } from "@/auth";
import { isAuthBypassed } from "@/lib/auth-flags";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const allComments = await listComments(event.slug);
  const mediaComments = Object.fromEntries(
    event.media.map((item) => [
      item.id,
      allComments.filter((comment) => comment.targetType === "media" && comment.targetId === item.id)
    ])
  );
  const session = isAuthBypassed() ? null : await safeAuth();
  const viewerAuthenticated = isAuthBypassed() || Boolean(session?.user?.email);

  return (
    <main className="shell">
      <SiteHeader />
      <div className="page">
        <AnalyticsTracker eventSlug={event.slug} />
        {event.status === "updating" ? (
          <EventUnavailableView event={event} />
        ) : (
          <EventPublicView event={event} mediaComments={mediaComments} viewerAuthenticated={viewerAuthenticated} />
        )}
      </div>
    </main>
  );
}
