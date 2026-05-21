import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { EventPublicView } from "@/components/EventPublicView";
import { getEventBySlug, listComments } from "@/lib/backend-api";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const allComments = await listComments(event.slug);
  const comments = allComments.filter((comment) => comment.targetType === "event" && comment.targetId === event.slug);
  const mediaComments = Object.fromEntries(
    event.media.map((item) => [
      item.id,
      allComments.filter((comment) => comment.targetType === "media" && comment.targetId === item.id)
    ])
  );

  return (
    <main className="shell">
      <SiteHeader />
      <div className="page">
        <EventPublicView event={event} comments={comments} mediaComments={mediaComments} />
      </div>
    </main>
  );
}
