import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, CalendarDays, Images, MapPin, MessageCircle, PartyPopper, Radio, RefreshCw, Trophy, Video } from "lucide-react";
import type { Comment, EventRecord, EventSection, FeedPost, RankingRow } from "@/lib/types";
import { getPublicBaseUrl } from "@/lib/public-url";
import { CommentBox } from "./comment-box";
import { MainEventSoundtrack } from "./main-event-soundtrack";
import { MediaCard } from "./media-card";
import { MediaContributionForm } from "./media-contribution-form";
import { MatchSchedule } from "./match-schedule";
import { ShareCodeControls } from "./share-code-controls";

const eurocampMapsUrl = "https://www.google.com/maps/search/?api=1&query=Eurocamp%20Cesenatico";

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

export function EventCompletedNotice({ event }: { event: EventRecord }) {
  return (
    <section className="event-completed-notice" aria-label="Evento completato">
      <div>
        <span className="small-label">Evento completato</span>
        <strong>{event.title} si e concluso.</strong>
      </div>
      <p>Puoi ancora consultare media, feed, classifiche, QR e contenuti pubblicati dagli organizzatori.</p>
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
      heroImage: event.coverImage,
      streamUrl: ""
    }
  ];
}

export async function EventPublicView({
  event,
  mediaComments,
  viewerAuthenticated
}: {
  event: EventRecord;
  mediaComments: Record<string, Comment[]>;
  viewerAuthenticated: boolean;
}) {
  const siteUrl = await getPublicBaseUrl();
  const eventUrl = `${siteUrl}/events/${event.slug}`;
  const qrDataUrl = await QRCode.toDataURL(eventUrl, { margin: 1, width: 220 });
  const sections = getEventSections(event);
  const generalMedia = event.media.filter((item) => !item.sectionId);
  const mediaIndex = getMediaIndexGroups(event, sections);
  const liveMatches = event.matches.filter((match) => match.status === "live").length;
  const programItems = sections.reduce((total, section) => total + (section.programItems?.length || 0), 0);
  const latestFeed = getLatestFeed(event.feed);
  const rawMainStreamUrl = event.streamUrl;
  const mainStreamUrl = normalizeStreamingUrl(rawMainStreamUrl);
  const mainStreamWatchUrl = getStreamingWatchUrl(rawMainStreamUrl, mainStreamUrl);
  const hasSoundtrack = isDonBoscoCupEvent(event);

  return (
    <>
      {hasSoundtrack ? <MainEventSoundtrack src="/uploads/soundtrack.mpeg" /> : null}
      {event.status === "completed" ? <EventCompletedNotice event={event} /> : null}
      <section className="hero event-hero main-event-hero">
        <div className="hero-copy">
          <span className="kicker"><Radio size={16} /> Manifestazione principale</span>
          <h1>{event.title}</h1>
          <p className="lead">{event.subtitle}</p>
          <p className="formatted-description">{event.description}</p>
          <div className="hero-actions">
            <a className="button" href="#eventi-interni"><PartyPopper size={18} /> Scegli evento</a>
            {mainStreamUrl ? <a className="ghost-button" href="#streaming"><Video size={18} /> Diretta TV</a> : null}
            <a className="ghost-button" href="#qr"><CalendarDays size={18} /> QR manifestazione</a>
          </div>
        </div>
        <div className="hero-media">
          <Image src={event.coverImage} width={900} height={1120} alt={event.title} priority />
          <a className="hero-badge hero-badge-link" href={getLocationMapsUrl(event.location)} target="_blank" rel="noreferrer">
            <div>
              <strong>{event.location}</strong>
              <span className="muted">{formatRange(event.startsAt, event.endsAt)}</span>
            </div>
            <MapPin color="#15427f" />
          </a>
        </div>
      </section>

      <section className="public-stats-grid compact-stats" aria-label="Numeri manifestazione">
        <div className="stat-card"><strong>{sections.length}</strong><p>Eventi</p></div>
        <div className="stat-card"><strong>{event.matches.length}</strong><p>Partite</p></div>
        <div className="stat-card"><strong>{liveMatches}</strong><p>Live ora</p></div>
        <div className="stat-card"><strong>{programItems}</strong><p>Punti programma</p></div>
      </section>

      {latestFeed.length > 0 ? (
        <section className="section main-feed-section">
          <div className="main-feed-alert-heading">
            <div>
              <span className="small-label">Notifiche</span>
              <h2>Ultimi aggiornamenti</h2>
            </div>
            <span className="status">{latestFeed.length} nuove</span>
          </div>
          <div className="main-feed-list">
            {latestFeed.map((post) => {
              const section = sections.find((item) => item.id === post.sectionId);
              const href = section ? `/events/${event.slug}/${section.slug}#feed` : `/events/${event.slug}`;

              return (
                <Link className="main-feed-card" href={href} key={post.id}>
                  <div className="feed-item-header">
                    <strong>{post.title}</strong>
                    <span className="status">{post.type}</span>
                  </div>
                  <p className="formatted-description">{post.body}</p>
                  <div className="main-feed-meta">
                    <span><CalendarDays size={14} /> {formatDate(post.createdAt)}</span>
                    {section ? <span>{section.title}</span> : <span>Manifestazione</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {mainStreamUrl ? (
        <StreamingPanel
          id="streaming"
          title="Streaming TV"
          text="Diretta principale della manifestazione, visibile anche senza entrare nel singolo campionato."
          streamUrl={mainStreamUrl}
          watchUrl={mainStreamWatchUrl}
        />
      ) : null}

      <section className="section main-media-section" id="media">
        <div className="public-section-heading">
          <div>
            <span className="small-label">Foto e video</span>
            <h2>Media della manifestazione</h2>
            <p className="muted">Scegli una categoria per vedere foto, video, like e commenti collegati.</p>
          </div>
        </div>
        {event.media.length === 0 ? <div className="empty">Nessun contenuto media pubblicato.</div> : null}
        <div className="main-media-index-grid">
          {mediaIndex.map((group) => {
            const card = (
              <>
                <span className={`media-index-icon media-index-icon-${group.type}`}>
                  {group.type === "general" ? <Images size={22} /> : group.type === "campionato" ? <Trophy size={22} /> : <PartyPopper size={22} />}
                </span>
                <div>
                  <strong>{group.title}</strong>
                  <p>{group.description}</p>
                </div>
                <span className="media-index-count">{group.count}</span>
              </>
            );

            return group.href ? (
              <Link className="main-media-index-card" href={group.href} key={group.id}>
                {card}
              </Link>
            ) : (
              <div className="main-media-index-card" key={group.id}>
                {card}
              </div>
            );
          })}
        </div>
        {generalMedia.length > 0 ? (
          <div className="main-general-media-strip" id="media-generale">
            <div className="main-general-media-heading">
              <span className="small-label">Manifestazione generale</span>
              <strong>{generalMedia.length} media</strong>
            </div>
            <div className="media-grid main-event-media-grid">
              {generalMedia.map((item) => (
                <MediaCard
                  eventId={event.slug}
                  item={item}
                  comments={mediaComments[item.id] || []}
                  viewerAuthenticated={viewerAuthenticated}
                  scopeLabel="Manifestazione generale"
                  key={item.id}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="section card" id="qr">
        <div className="card-body qr-card main-event-qr">
          <span className="small-label">Accesso alla manifestazione</span>
          <h2>QR manifestazione</h2>
          <p className="muted">Porta il pubblico alla pagina principale, da cui potra scegliere il singolo evento da seguire.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} width={220} height={220} alt="QR code manifestazione" />
          <p className="share-code-url">{eventUrl}</p>
          <ShareCodeControls url={eventUrl} qrDataUrl={qrDataUrl} fileName={`${event.slug}-qr.png`} />
        </div>
      </section>

      <InternalEventsSection event={event} sections={sections} />
    </>
  );
}

export async function EventSectionPublicView({
  event,
  section,
  comments,
  mediaComments,
  viewerAuthenticated,
  viewerIsAdmin
}: {
  event: EventRecord;
  section: EventSection;
  comments: Comment[];
  mediaComments: Record<string, Comment[]>;
  viewerAuthenticated: boolean;
  viewerIsAdmin: boolean;
}) {
  return section.type === "intrattenimento" ? (
    <EntertainmentEventView event={event} section={section} comments={comments} mediaComments={mediaComments} viewerAuthenticated={viewerAuthenticated} viewerIsAdmin={viewerIsAdmin} />
  ) : (
    <ChampionshipEventView event={event} section={section} comments={comments} mediaComments={mediaComments} viewerAuthenticated={viewerAuthenticated} viewerIsAdmin={viewerIsAdmin} />
  );
}

async function ChampionshipEventView({
  event,
  section,
  comments,
  mediaComments,
  viewerAuthenticated,
  viewerIsAdmin
}: {
  event: EventRecord;
  section: EventSection;
  comments: Comment[];
  mediaComments: Record<string, Comment[]>;
  viewerAuthenticated: boolean;
  viewerIsAdmin: boolean;
}) {
  const siteUrl = await getPublicBaseUrl();
  const sectionUrl = `${siteUrl}/events/${event.slug}/${section.slug}`;
  const qrDataUrl = await QRCode.toDataURL(sectionUrl, { margin: 1, width: 220 });
  const matches = getSectionItems(event.matches, section, getFirstCampionatoId(event));
  const rankings = getSectionItems(event.rankings, section, getFirstCampionatoId(event));
  const media = getSectionItems(event.media, section, getFirstCampionatoId(event));
  const feed = getSectionItems(event.feed, section, getFirstCampionatoId(event));
  const liveMatch = matches.find((match) => match.status === "live");
  const rankingColumns = getRankingColumns(event, rankings);
  const rawStreamUrl = section.streamUrl || liveMatch?.streamUrl || "";
  const streamUrl = normalizeStreamingUrl(rawStreamUrl);
  const streamWatchUrl = getStreamingWatchUrl(rawStreamUrl, streamUrl);
  const totalMediaComments = Object.values(mediaComments).reduce((total, items) => total + items.length, 0);
  const sectionLabels = getSectionLabelMap(getEventSections(event));

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
          <a className="hero-badge hero-badge-link" href={getLocationMapsUrl(section.location || event.location)} target="_blank" rel="noreferrer">
            <div>
              <strong>{section.location || event.location}</strong>
              <span className="muted">{event.categories.join(" / ")}</span>
            </div>
            <MapPin color="#15427f" />
          </a>
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

      <section className="quick-access-bar" id="qr">
        <div>
          <span className="small-label">Accesso rapido</span>
          <h2>QR evento</h2>
          <p className="muted">Apri direttamente questo campionato da ingresso, reception o materiale stampato.</p>
        </div>
        <div className="quick-access-actions">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} width={96} height={96} alt="QR code evento" />
          <span className="share-code-url compact">{sectionUrl}</span>
          <ShareCodeControls url={sectionUrl} qrDataUrl={qrDataUrl} fileName={`${event.slug}-${section.slug}-qr.png`} />
        </div>
      </section>

      <section className="section card" id="calendario">
        <div className="card-body">
          <div className="section-title-row">
            <div>
              <span className="small-label">Programma</span>
              <h2>Calendario partite</h2>
              <p className="muted">Cerca una squadra, controlla il campo e scorri le gare organizzate per girone.</p>
            </div>
            {liveMatch ? <span className="status live">Live ora</span> : <span className="status">Aggiornato</span>}
          </div>
          <MatchSchedule matches={matches} fields={event.fields || []} />
        </div>
      </section>

      {streamUrl ? (
        <StreamingPanel
          title="Streaming TV"
          text="Il player mostra il canale associato a questo evento o alla partita live."
          streamUrl={streamUrl}
          watchUrl={streamWatchUrl}
        />
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
          <MediaContributionForm eventSlug={event.slug} viewerIsAdmin={viewerIsAdmin} sectionId={section.id} />
          <div className="media-grid">
            {media.map((item) => (
              <MediaCard
                eventId={event.slug}
                item={item}
                comments={mediaComments[item.id] || []}
                viewerAuthenticated={viewerAuthenticated}
                scopeLabel={getMediaScopeLabel(item, sectionLabels)}
                scopeHref={getMediaScopeHref(event, item, getEventSections(event))}
                key={item.id}
              />
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
  mediaComments,
  viewerAuthenticated,
  viewerIsAdmin
}: {
  event: EventRecord;
  section: EventSection;
  comments: Comment[];
  mediaComments: Record<string, Comment[]>;
  viewerAuthenticated: boolean;
  viewerIsAdmin: boolean;
}) {
  const rawStreamUrl = section.streamUrl || "";
  const streamUrl = normalizeStreamingUrl(rawStreamUrl);
  const streamWatchUrl = getStreamingWatchUrl(rawStreamUrl, streamUrl);
  const media = getSectionItems(event.media, section, getFirstCampionatoId(event));
  const sectionLabels = getSectionLabelMap(getEventSections(event));

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
            <a className="event-location-link" href={getLocationMapsUrl(section.location || event.location)} target="_blank" rel="noreferrer">
              <MapPin size={16} /> {section.location || event.location}
            </a>
          </div>
        </div>
      </section>

      {streamUrl ? (
        <StreamingPanel
          title="Streaming TV"
          text="Diretta dedicata a questo evento di intrattenimento."
          streamUrl={streamUrl}
          watchUrl={streamWatchUrl}
        />
      ) : null}

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

      <section className="section card" id="media">
        <div className="card-body">
          <div className="public-section-heading">
            <div>
              <span className="small-label">Foto e video</span>
              <h2>Media evento</h2>
              <p className="muted">Contenuti ufficiali collegati a questo evento.</p>
            </div>
          </div>
          <MediaContributionForm eventSlug={event.slug} viewerIsAdmin={viewerIsAdmin} sectionId={section.id} />
          {media.length === 0 ? <div className="empty">Nessun contenuto media pubblicato.</div> : null}
          <div className="media-grid">
            {media.map((item) => (
              <MediaCard
                eventId={event.slug}
                item={item}
                comments={mediaComments[item.id] || []}
                viewerAuthenticated={viewerAuthenticated}
                scopeLabel={getMediaScopeLabel(item, sectionLabels)}
                scopeHref={getMediaScopeHref(event, item, getEventSections(event))}
                key={item.id}
              />
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

function getSectionItems<T extends { sectionId?: string }>(items: T[], section: EventSection, firstCampionatoId?: string) {
  const scoped = items.filter((item) => item.sectionId === section.id);
  if (scoped.length > 0) return scoped;
  if (section.type === "campionato" && section.id === firstCampionatoId) {
    return items.filter((item) => !item.sectionId);
  }
  return [];
}

function getSectionLabelMap(sections: EventSection[]) {
  return new Map(sections.map((section) => [section.id, section.title]));
}

function getMediaScopeLabel(item: { sectionId?: string }, sectionLabels: Map<string, string>) {
  if (!item.sectionId) return "Manifestazione generale";
  return sectionLabels.get(item.sectionId) || "Evento interno";
}

function getMediaScopeHref(event: EventRecord, item: { sectionId?: string }, sections: EventSection[]) {
  if (!item.sectionId) return undefined;
  const section = sections.find((candidate) => candidate.id === item.sectionId);
  return section ? `/events/${event.slug}/${section.slug}` : undefined;
}

function getMediaIndexGroups(event: EventRecord, sections: EventSection[]) {
  const generalCount = event.media.filter((item) => !item.sectionId).length;
  const groups = [
    {
      id: "general",
      type: "general",
      title: "Manifestazione generale",
      description: "Media collegati alla pagina principale.",
      count: generalCount,
      href: "#media-generale"
    }
  ];

  for (const section of sections) {
    groups.push({
      id: section.id,
      type: section.type,
      title: section.title,
      description: section.type === "campionato" ? "Media del campionato." : "Media dell'evento di intrattenimento.",
      count: event.media.filter((item) => item.sectionId === section.id).length,
      href: `/events/${event.slug}/${section.slug}#media`
    });
  }

  return groups.filter((group) => group.count > 0);
}

function isDonBoscoCupEvent(event: EventRecord) {
  const normalized = `${event.slug} ${event.title}`.toLowerCase();
  return normalized.includes("don-bosco-cup") || normalized.includes("don bosco cup");
}

function getLocationMapsUrl(location: string) {
  const normalized = location.toLowerCase();
  if (normalized.includes("cesenatico")) return eurocampMapsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
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

function InternalEventsSection({ event, sections }: { event: EventRecord; sections: EventSection[] }) {
  return (
    <details className="section internal-events-section internal-events-collapsible" id="eventi-interni">
      <summary>
        <div>
          <span className="small-label">Eventi della manifestazione</span>
          <h2>Scegli cosa seguire</h2>
          <p className="muted">{sections.length} eventi interni disponibili.</p>
        </div>
        <span className="button internal-events-toggle">Apri elenco</span>
      </summary>
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
    </details>
  );
}

function StreamingPanel({
  id,
  title,
  text,
  streamUrl,
  watchUrl
}: {
  id?: string;
  title: string;
  text: string;
  streamUrl: string;
  watchUrl: string;
}) {
  return (
    <section className="section card streaming-section" id={id}>
      <div className="card-body">
        <div className="section-title-row">
          <div>
            <span className="small-label">Diretta</span>
            <h2>{title}</h2>
            <p className="muted">{text}</p>
          </div>
          <span className="status live">Diretta</span>
        </div>
        <iframe className="embed" src={streamUrl} title="Streaming live" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
        {watchUrl ? (
          <p className="stream-fallback">
            Se il player non carica, <a href={watchUrl} target="_blank" rel="noreferrer">apri la diretta su YouTube</a>.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function getLatestFeed(feed: FeedPost[]) {
  return [...feed]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
}

function normalizeStreamingUrl(value?: string): string {
  const rawUrl = value?.trim();
  if (!rawUrl) return "";

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "consent.youtube.com") {
      const continuedUrl = url.searchParams.get("continue") || url.searchParams.get("continue_url");
      return continuedUrl ? normalizeStreamingUrl(continuedUrl) : rawUrl;
    }

    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? youtubeEmbedUrl(videoId, url.searchParams) : rawUrl;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const pathParts = url.pathname.split("/").filter(Boolean);

      if (pathParts[0] === "embed" && pathParts[1] === "live_stream") {
        return `https://www.youtube.com/embed/live_stream?${url.searchParams.toString()}`;
      }

      if (pathParts[0] === "embed" && pathParts[1]) {
        return youtubeEmbedUrl(pathParts[1], url.searchParams);
      }

      if (pathParts[0] === "live" && pathParts[1]) {
        return youtubeEmbedUrl(pathParts[1], url.searchParams);
      }

      if (pathParts[0] === "shorts" && pathParts[1]) {
        return youtubeEmbedUrl(pathParts[1], url.searchParams);
      }

      const videoId = url.searchParams.get("v");
      if (videoId) return youtubeEmbedUrl(videoId, url.searchParams);
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

function youtubeEmbedUrl(videoId: string, params: URLSearchParams): string {
  const embedParams = new URLSearchParams();
  const start = params.get("start") || secondsFromTimestamp(params.get("t") || "");
  const list = params.get("list");

  if (start) embedParams.set("start", start);
  if (list) embedParams.set("list", list);

  const query = embedParams.toString();
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}${query ? `?${query}` : ""}`;
}

function secondsFromTimestamp(value: string): string {
  if (!value) return "";
  if (/^\d+$/.test(value)) return value;

  const match = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  if (!match) return "";

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? String(total) : "";
}

function getStreamingWatchUrl(rawValue?: string, embedUrl?: string): string {
  const rawUrl = rawValue?.trim();

  if (rawUrl) {
    try {
      const url = new URL(rawUrl);
      const host = url.hostname.replace(/^www\./, "");

      if (host === "consent.youtube.com") {
        const continuedUrl = url.searchParams.get("continue") || url.searchParams.get("continue_url");
        return continuedUrl ? getStreamingWatchUrl(continuedUrl, embedUrl) : rawUrl;
      }

      if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
        return rawUrl;
      }
    } catch {
      return rawUrl;
    }
  }

  if (!embedUrl) return "";

  try {
    const url = new URL(embedUrl);
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (pathParts[0] === "embed" && pathParts[1] && pathParts[1] !== "live_stream") {
      return `https://www.youtube.com/watch?v=${encodeURIComponent(pathParts[1])}`;
    }

    if (pathParts[0] === "embed" && pathParts[1] === "live_stream" && url.searchParams.get("channel")) {
      return `https://www.youtube.com/channel/${encodeURIComponent(url.searchParams.get("channel") || "")}/live`;
    }
  } catch {
    return "";
  }

  return embedUrl;
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
