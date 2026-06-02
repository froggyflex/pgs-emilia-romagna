import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { EventCompletedNotice, EventSectionPublicView, EventUnavailableView, getEventSections } from "@/components/EventPublicView";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { getEventBySlug, listComments } from "@/lib/backend-api";
import { isAdminEmail, safeAuth } from "@/auth";
import { isAuthBypassed } from "@/lib/auth-flags";

export const dynamic = "force-dynamic";

export default async function EventSectionPage({ params }: { params: Promise<{ slug: string; sectionSlug: string }> }) {
  const { slug, sectionSlug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  if (event.status === "updating") {
    return (
      <main className="shell">
        <SiteHeader />
        <div className="page">
          <AnalyticsTracker eventSlug={event.slug} sectionSlug={sectionSlug} />
          <EventUnavailableView event={event} />
        </div>
      </main>
    );
  }

  const section = getEventSections(event).find((item) => item.slug === sectionSlug);

  if (!section) {
    notFound();
  }

  const allComments = await listComments(event.slug);
  const comments = allComments.filter((comment) => (
    comment.targetType === "event" &&
    (comment.targetId === section.id || (section.type === "campionato" && comment.targetId === event.slug))
  ));
  const sectionMedia = event.media.filter((item) => !item.sectionId || item.sectionId === section.id);
  const mediaComments = Object.fromEntries(
    sectionMedia.map((item) => [
      item.id,
      allComments.filter((comment) => comment.targetType === "media" && comment.targetId === item.id)
    ])
  );
  const session = isAuthBypassed() ? null : await safeAuth();
  const viewerAuthenticated = isAuthBypassed() || Boolean(session?.user?.email);
  const viewerIsAdmin = isAuthBypassed() || isAdminEmail(session?.user?.email);

  return (
    <main className="shell">
      <SiteHeader />
      <div className="page">
        <AnalyticsTracker eventSlug={event.slug} sectionSlug={section.slug} />
        {event.status === "completed" ? <EventCompletedNotice event={event} /> : null}
        <EventSectionPublicView
          event={event}
          section={section}
          comments={comments}
          mediaComments={mediaComments}
          viewerAuthenticated={viewerAuthenticated}
          viewerIsAdmin={viewerIsAdmin}
        />
      </div>
    </main>
  );
}
