import Link from "next/link";
import { CalendarDays, MapPin, Radio, ShieldCheck, Trophy, Video } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { listEvents } from "@/lib/backend-api";
import { signInAdminWithGoogle } from "@/app/actions";
import { isAdminEmail, safeAuth } from "@/auth";
import { isAuthBypassed } from "@/lib/auth-flags";
import type { EventRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatRange(event: EventRecord) {
  const start = new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" }).format(new Date(event.startsAt));
  const end = new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" }).format(new Date(event.endsAt));
  return start === end ? start : `${start} - ${end}`;
}

function latestFeed(event: EventRecord) {
  return event.feed[0]?.title || "Nessun aggiornamento pubblicato";
}

export default async function Home() {
  const events = await listEvents();
  const session = isAuthBypassed() ? null : await safeAuth();
  const isAdmin = isAuthBypassed() || isAdminEmail(session?.user?.email);
  const liveEvents = events.filter((event) => event.matches.some((match) => match.status === "live")).length;
  const mediaCount = events.reduce((total, event) => total + event.media.length, 0);
  const matchCount = events.reduce((total, event) => total + event.matches.length, 0);

  return (
    <main className="shell public-shell">
      <SiteHeader />
      <div className="page public-home-page">
        <section className="directory-hero">
          <div>
            <span className="kicker"><Radio size={16} /> PGS Emilia-Romagna</span>
            <h1>Eventi live</h1>
            <p className="lead">Scegli una manifestazione e segui feed, calendario, classifiche, media, commenti e streaming dedicati.</p>
          </div>
          {isAdmin ? (
            <Link className="ghost-button" href="/admin"><ShieldCheck size={18} /> Area operatori</Link>
          ) : !session?.user ? (
            <form action={signInAdminWithGoogle}>
              <button className="ghost-button" type="submit"><ShieldCheck size={18} /> Area operatori</button>
            </form>
          ) : null}
        </section>

        <section className="home-overview">
          <div className="overview-card"><strong>{events.length}</strong><span>Eventi disponibili</span></div>
          <div className="overview-card"><strong>{liveEvents}</strong><span>Eventi live</span></div>
          <div className="overview-card"><strong>{matchCount}</strong><span>Partite</span></div>
          <div className="overview-card"><strong>{mediaCount}</strong><span>Media</span></div>
        </section>

        <section className="section events-directory">
          <div className="public-section-heading">
            <div>
              <h2>Manifestazioni disponibili</h2>
              <p className="muted">Ogni evento apre una pagina autonoma con i suoi aggiornamenti e contenuti.</p>
            </div>
          </div>

          <div className="event-list">
            {events.length === 0 ? (
              <div className="empty">Nessun evento disponibile in questo momento.</div>
            ) : null}
            {events.map((event) => {
              const isLive = event.matches.some((match) => match.status === "live");

              return (
                <Link className="event-list-row" href={`/events/${event.slug}`} key={event.slug}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.coverImage} alt={event.title} />
                  <div className="event-list-main">
                    <div className="event-row-title">
                      <h3>{event.title}</h3>
                      {isLive ? <span className="status live">Live</span> : <span className="status">Online</span>}
                    </div>
                    <p>{event.subtitle}</p>
                    <div className="event-row-stats">
                      <span><CalendarDays size={15} /> {formatRange(event)}</span>
                      <span><MapPin size={15} /> {event.location}</span>
                      <span><Trophy size={15} /> {event.rankings.length} classifiche</span>
                      <span><Video size={15} /> {event.media.length} media</span>
                    </div>
                  </div>
                  <div className="event-list-side">
                    <span className="small-label">Ultimo aggiornamento</span>
                    <strong>{latestFeed(event)}</strong>
                    <span className="button">Apri evento</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
