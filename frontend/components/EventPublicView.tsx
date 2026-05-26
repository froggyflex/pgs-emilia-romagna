import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, CalendarDays, MapPin, MessageCircle, PartyPopper, Radio, RefreshCw, Trophy, Video } from "lucide-react";
import type { Comment, EventRecord, EventSection, MatchStatus, RankingRow } from "@/lib/types";
import { CommentBox } from "./comment-box";
import { MainEventSoundtrack } from "./main-event-soundtrack";
import { MediaCard } from "./media-card";
import { MediaContributionForm } from "./media-contribution-form";
import { ShareCodeControls } from "./share-code-controls";

const statusLabels: Record<MatchStatus, string> = {
  scheduled: "In programma",
  live: "Live",
  finished: "Finita",
  postponed: "Rinviata"
};

export function EventUnavailableView({ event }: { event: EventRecord }) {
  return (
    <section className="event-status-page">
      <div className="event-status-card">
        <span className="kicker"><RefreshCw size={16} /> In lavorazione</span>
        <h1>{event.title}</h1>
        <p className="lead">La pagina evento e in aggiornamento.</p>
        <p className="muted">Gli organizzatori stanno preparando o aggiornando i contenuti. Torna piu tardi per vedere calendario, classifiche, media e feed live.</p>
        <Link className="button" href="/">Torna agli eventi</Link>
      </div>
    </section>
  );
}

export function getEventSections(event: EventRecord): EventSection[] {
  if (Array.isArray(event.sections)) return event.sections;

  return [
    {
      id: "default-campionato",
      slug: "campionato",
      type: "campionato",
      title: "Campionato",
      subtitle: "Partite, risultati e classifiche",
      description: "Calendario, classifiche, feed, media e commenti della manifestazione.",
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
      heroImage: event.coverImage
    }
  ];
}

export async function EventPublicView({ event }: { event: EventRecord }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eventilive.pgsemiliaromagna.org";
  const eventUrl = `${siteUrl}/events/${event.slug}`;
  const qrDataUrl = await QRCode.toDataURL(eventUrl, { margin: 1, width: 220 });
  const sections = getEventSections(event);
  const liveMatches = event.matches.filter((match) => match.status === "live").length;
  const programItems = sections.reduce((total, section) => total + (section.programItems?.length || 0), 0);
  const hasSoundtrack = isDonBoscoCupEvent(event);

  return (
    <>
      {hasSoundtrack ? <MainEventSoundtrack src="/uploads/soundtrack.mpeg" /> : null}
      <section className="hero event-hero main-event-hero">
        <div className="hero-copy">
          <span className="kicker"><Radio size={16} /> Manifestazione principale</span>
          <h1>{event.title}</h1>
          <p className="lead">{event.subtitle}</p>
          <p className="formatted-description">{event.description}</p>
          <div className="hero-actions">
            <a className="button" href="#eventi-interni"><PartyPopper size={18} /> Scegli evento</a>
            <a className="ghost-button" href="#qr"><CalendarDays size={18} /> QR manifestazione</a>
          </div>
        </div>
        <div className="hero-media">
          <Image src={event.coverImage} width={900} height={1120} alt={event.title} priority />
          <div className="hero-badge">
            <div>
              <strong>{event.location}</strong>
              <span className="muted">{formatRange(event.startsAt, event.endsAt)}</span>
            </div>
            <MapPin color="#15427f" />
          </div>
        </div>
      </section>

      <section className="public-stats-grid compact-stats" aria-label="Numeri manifestazione">
        <div className="stat-card"><strong>{sections.length}</strong><p>Eventi</p></div>
        <div className="stat-card"><strong>{event.matches.length}</strong><p>Partite</p></div>
        <div className="stat-card"><strong>{liveMatches}</strong><p>Live ora</p></div>
        <div className="stat-card"><strong>{programItems}</strong><p>Punti programma</p></div>
      </section>

      <section className="section internal-events-section" id="eventi-interni">
        <div className="public-section-heading">
          <div>
            <span className="small-label">Eventi della manifestazione</span>
            <h2>Scegli cosa seguire</h2>
            <p className="muted">Ogni evento interno ha una pagina dedicata con il contenuto corretto per il suo tipo.</p>
          </div>
        </div>
        <div className="internal-event-grid">
          {sections.length === 0 ? <div className="empty">Nessun evento interno configurato.</div> : null}
          {sections.map((section) => (
            <Link className={`internal-event-card internal-event-card-${section.type}`} href={`/events/${event.slug}/${section.slug}`} key={section.id}>
              <span className="section-type-badge">
                {section.type === "campionato" ? <Trophy size={15} /> : <PartyPopper size={15} />}
                {section.type === "campionato" ? "Campionato" : "Intrattenimento"}
              </span>
              <h3>{section.title}</h3>
              <p className="formatted-description">{section.subtitle || section.description || "Evento interno della manifestazione."}</p>
              <div className="internal-event-meta">
                {section.startsAt ? <span><CalendarDays size={15} /> {formatDate(section.startsAt)}</span> : null}
                <span><MapPin size={15} /> {section.location || event.location}</span>
              </div>
              <span className="button internal-event-action">Apri evento</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section card" id="qr">
        <div className="card-body qr-card main-event-qr">
          <span className="small-label">Accesso alla manifestazione</span>
          <h2>QR manifestazione</h2>
          <p className="muted">Porta il pubblico alla pagina principale, da cui potra scegliere il singolo evento da seguire.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} width={220} height={220} alt="QR code manifestazione" />
          <ShareCodeControls url={eventUrl} qrDataUrl={qrDataUrl} fileName={`${event.slug}-qr.png`} />
        </div>
      </section>
    </>
  );
}

export async function EventSectionPublicView({
  event,
  section,
  comments,
  mediaComments,
  viewerAuthenticated
}: {
  event: EventRecord;
  section: EventSection;
  comments: Comment[];
  mediaComments: Record<string, Comment[]>;
  viewerAuthenticated: boolean;
}) {
  return section.type === "intrattenimento" ? (
    <EntertainmentEventView event={event} section={section} comments={comments} viewerAuthenticated={viewerAuthenticated} />
  ) : (
    <ChampionshipEventView event={event} section={section} comments={comments} mediaComments={mediaComments} viewerAuthenticated={viewerAuthenticated} />
  );
}

async function ChampionshipEventView({
  event,
  section,
  comments,
  mediaComments,
  viewerAuthenticated
}: {
  event: EventRecord;
  section: EventSection;
  comments: Comment[];
  mediaComments: Record<string, Comment[]>;
  viewerAuthenticated: boolean;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eventilive.pgsemiliaromagna.org";
  const sectionUrl = `${siteUrl}/events/${event.slug}/${section.slug}`;
  const qrDataUrl = await QRCode.toDataURL(sectionUrl, { margin: 1, width: 220 });
  const matches = getSectionItems(event.matches, section, getFirstCampionatoId(event));
  const rankings = getSectionItems(event.rankings, section, getFirstCampionatoId(event));
  const media = getSectionItems(event.media, section, getFirstCampionatoId(event));
  const feed = getSectionItems(event.feed, section, getFirstCampionatoId(event));
  const liveMatch = matches.find((match) => match.status === "live");
  const rankingColumns = getRankingColumns(event, rankings);
  const streamUrl = liveMatch?.streamUrl || event.streamUrl;
  const totalMediaComments = Object.values(mediaComments).reduce((total, items) => total + items.length, 0);

  return (
    <>
      <section className="subevent-topline">
        <Link className="ghost-button" href={`/events/${event.slug}`}><ArrowLeft size={17} /> Manifestazione</Link>
        <span className="section-type-badge"><Trophy size={15} /> Campionato</span>
      </section>

      <section className="hero event-hero">
        <div className="hero-copy">
          <span className="kicker"><Radio size={16} /> {event.title}</span>
          <h1>{section.title}</h1>
          {section.subtitle ? <p className="lead">{section.subtitle}</p> : null}
          {section.description ? <p className="formatted-description">{section.description}</p> : null}
          <div className="hero-actions">
            <a className="button" href="#calendario"><CalendarDays size={18} /> Calendario</a>
            <a className="ghost-button" href="#classifiche"><Trophy size={18} /> Classifiche</a>
            <a className="ghost-button" href="#media"><Video size={18} /> Media</a>
          </div>
        </div>
        <div className="hero-media">
          <Image src={section.heroImage || event.coverImage} width={900} height={1120} alt={section.title} priority />
          <div className="hero-badge">
            <div>
              <strong>{section.location || event.location}</strong>
              <span className="muted">{event.categories.join(" / ")}</span>
            </div>
            <MapPin color="#15427f" />
          </div>
        </div>
      </section>

      <section className="public-stats-grid compact-stats championship-top-stats" aria-label="Numeri campionato">
        <div className="stat-card"><strong>{event.categories.length}</strong><p>Categorie</p></div>
        <div className="stat-card"><strong>{matches.length}</strong><p>Partite</p></div>
        <div className="stat-card"><strong>{media.length}</strong><p>Media</p></div>
        <div className="stat-card"><strong>{totalMediaComments + comments.length}</strong><p>Commenti</p></div>
      </section>

      <nav className="event-subnav" aria-label="Sezioni campionato">
        <a href="#calendario">Calendario</a>
        <a href="#classifiche">Classifiche</a>
        <a href="#feed">Feed</a>
        <a href="#media">Foto e video</a>
        <a href="#commenti">Commenti</a>
      </nav>

      <section className="section two-grid" id="calendario">
        <div className="card">
          <div className="card-body">
            <div className="section-title-row">
              <div>
                <span className="small-label">Programma</span>
                <h2>Calendario partite</h2>
                <p className="muted">Orari, campi, punteggi e stato aggiornati dalla regia evento.</p>
              </div>
              {liveMatch ? <span className="status live">Live ora</span> : <span className="status">Aggiornato</span>}
            </div>
            {matches.length === 0 ? <div className="empty">Nessuna partita inserita.</div> : null}
            {matches.map((match) => (
              <div className="match-row" key={match.id}>
                <div>
                  <strong>{match.homeTeam} - {match.awayTeam}</strong>
                  <div className="match-meta">
                    <span><CalendarDays size={14} /> {formatDate(match.startsAt)}</span>
                    <span><MapPin size={14} /> {match.court}</span>
                    <span><Trophy size={14} /> {match.category}</span>
                  </div>
                </div>
                <div className="score">{match.homeScore ?? "-"}:{match.awayScore ?? "-"}</div>
                <span className={`status ${match.status === "live" ? "live" : match.status === "finished" ? "done" : ""}`}>
                  {statusLabels[match.status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-body qr-card">
            <span className="small-label">Accesso rapido</span>
            <h2>QR evento</h2>
            <p className="muted">Da stampare o mostrare all'ingresso per aprire direttamente questo campionato.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} width={220} height={220} alt="QR code evento" />
            <ShareCodeControls url={sectionUrl} qrDataUrl={qrDataUrl} fileName={`${event.slug}-${section.slug}-qr.png`} />
          </div>
        </div>
      </section>

      {streamUrl ? (
        <section className="section card">
          <div className="card-body">
            <div className="section-title-row">
              <div>
                <span className="small-label">Diretta</span>
                <h2>Streaming TV</h2>
                <p className="muted">Il player mostra il canale associato a questo evento o alla partita live.</p>
              </div>
              <span className="status live">Diretta</span>
            </div>
            <iframe className="embed" src={streamUrl} title="Streaming live" allowFullScreen />
          </div>
        </section>
      ) : null}

      <section className="section championship-results-grid">
        <div className="card public-ranking-card">
          <div className="card-body">
            <div className="section-title-row">
              <div>
                <span className="small-label">Risultati</span>
                <h2 id="classifiche">Classifiche</h2>
                <p className="muted">Tabella importata dalla segreteria gara e ottimizzata per la lettura da mobile.</p>
              </div>
            </div>
            <div className="ranking-table-wrap">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>POS</th>
                    {rankingColumns.map((column) => <th key={column}>{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...rankings].sort((a, b) => b.points - a.points).map((row, index) => (
                    <tr key={row.id}>
                      <td data-label="POS">{index + 1}</td>
                      {rankingColumns.map((column) => (
                        <td key={column} data-label={column}>{getRankingCell(row, column)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="section-title-row">
              <div>
                <span className="small-label">Aggiornamenti</span>
                <h2 id="feed">Feed live</h2>
                <p className="muted">Comunicazioni ufficiali, aggiornamenti live e note operative.</p>
              </div>
            </div>
            {feed.length === 0 ? <div className="empty">Nessun aggiornamento pubblicato.</div> : null}
            {feed.map((post) => (
              <article className="comment feed-post" key={post.id}>
                <div className="feed-item-header">
                  <strong>{post.title}</strong>
                  <span className="status">{post.type}</span>
                </div>
                <p className="muted">{post.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section card" id="media">
        <div className="card-body">
          <div className="public-section-heading">
            <div>
              <span className="small-label">Community</span>
              <h2>Foto e video</h2>
              <p className="muted">Contenuti commentabili con like e conversazioni dedicate.</p>
            </div>
          </div>
          <MediaContributionForm eventSlug={event.slug} viewerAuthenticated={viewerAuthenticated} />
          <div className="media-grid">
            {media.map((item) => (
              <MediaCard eventId={event.slug} item={item} comments={mediaComments[item.id] || []} viewerAuthenticated={viewerAuthenticated} key={item.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="section card" id="commenti">
        <div className="card-body">
          <span className="small-label">Discussione evento</span>
          <h2 className="icon-heading"><MessageCircle size={22} /> Commenti</h2>
          <CommentBox eventId={event.slug} targetType="event" targetId={section.id} comments={comments} viewerAuthenticated={viewerAuthenticated} />
        </div>
      </section>
    </>
  );
}

function EntertainmentEventView({
  event,
  section,
  comments,
  viewerAuthenticated
}: {
  event: EventRecord;
  section: EventSection;
  comments: Comment[];
  viewerAuthenticated: boolean;
}) {
  return (
    <>
      <section className="subevent-topline">
        <Link className="ghost-button" href={`/events/${event.slug}`}><ArrowLeft size={17} /> Manifestazione</Link>
        <span className="section-type-badge"><PartyPopper size={15} /> Intrattenimento</span>
      </section>

      <section
        className="entertainment-landing"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(7, 16, 31, 0.88), rgba(7, 16, 31, 0.34)), url("${section.heroImage || event.coverImage}")`
        }}
      >
        <div className="entertainment-landing-copy">
          <span className="kicker"><PartyPopper size={16} /> {event.title}</span>
          <h1>{section.title}</h1>
          {section.subtitle ? <p className="lead">{section.subtitle}</p> : null}
          {section.description ? <p className="formatted-description">{section.description}</p> : null}
          <div className="entertainment-meta">
            {section.startsAt ? <span><CalendarDays size={16} /> {formatDate(section.startsAt)}</span> : null}
            <span><MapPin size={16} /> {section.location || event.location}</span>
          </div>
        </div>
      </section>

      <section className="section program-showcase">
        <div className="program-panel">
          <div className="section-title-row">
            <div>
              <span className="small-label">Programma</span>
              <h2>Cosa succede</h2>
              <p className="muted">La scaletta pubblica dell'evento di intrattenimento.</p>
            </div>
          </div>
          {section.programItems?.length ? (
            <div className="program-list">
              {section.programItems.map((item) => (
                <article className="program-item" key={item.id}>
                  <time>{item.time}</time>
                  <div>
                    <strong>{item.title}</strong>
                    {item.description ? <p className="muted formatted-description">{item.description}</p> : null}
                    {item.location ? <span><MapPin size={14} /> {item.location}</span> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">Il programma non e ancora stato pubblicato.</div>
          )}
        </div>
      </section>

      <section className="section card" id="commenti">
        <div className="card-body">
          <span className="small-label">Discussione evento</span>
          <h2 className="icon-heading"><MessageCircle size={22} /> Commenti</h2>
          <CommentBox eventId={event.slug} targetType="event" targetId={section.id} comments={comments} viewerAuthenticated={viewerAuthenticated} />
        </div>
      </section>
    </>
  );
}

function getSectionItems<T extends { sectionId?: string }>(items: T[], section: EventSection, firstCampionatoId?: string) {
  const scoped = items.filter((item) => item.sectionId === section.id);
  if (scoped.length > 0) return scoped;
  if (section.type === "campionato" && section.id === firstCampionatoId) {
    return items.filter((item) => !item.sectionId);
  }
  return [];
}

function isDonBoscoCupEvent(event: EventRecord) {
  const normalized = `${event.slug} ${event.title}`.toLowerCase();
  return normalized.includes("don-bosco-cup") || normalized.includes("don bosco cup");
}

function getFirstCampionatoId(event: EventRecord) {
  return getEventSections(event).find((section) => section.type === "campionato")?.id;
}

function getRankingColumns(event: EventRecord, rankings: RankingRow[]) {
  if (event.rankingColumns?.length) return event.rankingColumns;
  if (rankings.some((row) => row.values)) {
    return Object.keys(rankings.find((row) => row.values)?.values || {});
  }
  return ["SQUADRE", "GIOCATE", "PUNTI"];
}

function getRankingCell(row: RankingRow, column: string) {
  if (row.values?.[column] !== undefined) return row.values[column];

  const fallback: Record<string, string | number | undefined> = {
    SQUADRE: row.team,
    SQUADRA: row.team,
    TEAM: row.team,
    GIOCATE: row.played,
    PUNTI: row.points,
    VINTE: row.wins,
    PERSE: row.losses,
    "QUOZ SET": row.setRatio
  };

  return fallback[column] ?? "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatRange(startValue: string, endValue: string) {
  const start = new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" }).format(new Date(startValue));
  const end = new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short" }).format(new Date(endValue));
  return start === end ? start : `${start} - ${end}`;
}
