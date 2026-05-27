import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { EventPublicView, EventUnavailableView } from "@/components/EventPublicView";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { getEventBySlug } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
    <main className="shell">
      <SiteHeader />
      <div className="page">
        <AnalyticsTracker eventSlug={event.slug} />
        {event.status === "updating" ? <EventUnavailableView event={event} /> : <EventPublicView event={event} />}
      </div>
    </main>
  );
}
