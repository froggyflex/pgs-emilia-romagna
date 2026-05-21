import Image from "next/image";
import QRCode from "qrcode";
import { CalendarDays, MapPin, MessageCircle, Radio, Trophy, Video } from "lucide-react";
import type { Comment, EventRecord, MatchStatus, RankingRow } from "@/lib/types";
import { CommentBox } from "./comment-box";
import { MediaCard } from "./media-card";

const statusLabels: Record<MatchStatus, string> = {
  scheduled: "In programma",
  live: "Live",
  finished: "Finita",
  postponed: "Rinviata"
};

function getRankingColumns(event: EventRecord) {
  if (event.rankingColumns?.length) return event.rankingColumns;
  if (event.rankings.some((row) => row.values)) {
    return Object.keys(event.rankings.find((row) => row.values)?.values || {});
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

export async function EventPublicView({
  event,
  comments,
  mediaComments
}: {
  event: EventRecord;
  comments: Comment[];
  mediaComments: Record<string, Comment[]>;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eventilive.pgsemiliaromagna.org";
  const eventUrl = `${siteUrl}/events/${event.slug}`;
  const qrDataUrl = await QRCode.toDataURL(eventUrl, { margin: 1, width: 220 });
  const liveMatch = event.matches.find((match) => match.status === "live");
  const nextMatch = event.matches.find((match) => match.status === "scheduled") || liveMatch || event.matches[0];
  const latestPost = event.feed[0];
  const rankingLeader = [...event.rankings].sort((a, b) => b.points - a.points)[0];
  const rankingColumns = getRankingColumns(event);
  const streamUrl = liveMatch?.streamUrl || event.streamUrl;
  const totalMediaComments = Object.values(mediaComments).reduce((total, items) => total + items.length, 0);

  return (
    <>
      <section className="hero event-hero">
        <div className="hero-copy">
          <span className="kicker"><Radio size={16} /> 28-31 maggio 2026</span>
          <h1>{event.title}</h1>
          <p className="lead">{event.subtitle}</p>
          <p>{event.description}</p>
          <div className="hero-actions">
            <a className="button" href="#calendario"><CalendarDays size={18} /> Calendario</a>
            <a className="ghost-button" href="#classifiche"><Trophy size={18} /> Classifiche</a>
            <a className="ghost-button" href="#media"><Video size={18} /> Media</a>
          </div>
        </div>
        <div className="hero-media">
          <Image src={event.coverImage} width={900} height={1120} alt={event.title} priority />
          <div className="hero-badge">
            <div>
              <strong>{event.location}</strong>
              <span className="muted">{event.categories.join(" / ")}</span>
            </div>
            <MapPin color="#15427f" />
          </div>
        </div>
      </section>

      <nav className="event-subnav" aria-label="Sezioni evento">
        <a href="#overview">Overview</a>
        <a href="#calendario">Calendario</a>
        <a href="#classifiche">Classifiche</a>
        <a href="#feed">Feed</a>
        <a href="#media">Foto e video</a>
        <a href="#commenti">Commenti</a>
      </nav>

      <section className="event-dashboard" id="overview" aria-label="Riepilogo evento">
        <div className="dashboard-primary">
          <span className={`status ${liveMatch ? "live" : ""}`}>{liveMatch ? "Live ora" : "Prossima partita"}</span>
          {nextMatch ? (
            <>
              <h2>{nextMatch.homeTeam} - {nextMatch.awayTeam}</h2>
              <p>{nextMatch.category} - {nextMatch.court} - {formatDate(nextMatch.startsAt)}</p>
              <strong>{nextMatch.homeScore ?? "-"}:{nextMatch.awayScore ?? "-"}</strong>
            </>
          ) : (
            <p className="muted">Nessuna partita configurata.</p>
          )}
        </div>
        <div className="dashboard-card">
          <span className="small-label">Ultimo aggiornamento</span>
          <h3>{latestPost?.title || "Nessun post"}</h3>
          <p className="muted">{latestPost?.body || "Il feed live non contiene ancora aggiornamenti."}</p>
        </div>
        <div className="dashboard-card">
          <span className="small-label">Prima posizione</span>
          <h3>{rankingLeader?.team || "Classifica non disponibile"}</h3>
          <p className="muted">{rankingLeader ? `${rankingLeader.category} - ${rankingLeader.points} punti` : "Aggiungi le righe classifica dall'admin."}</p>
        </div>
        <div className="dashboard-card compact-qr">
          <span className="small-label">QR evento</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} width={96} height={96} alt="QR code evento" />
        </div>
      </section>

      <section className="public-stats-grid compact-stats" aria-label="Numeri evento">
        <div className="stat-card"><strong>{event.categories.length}</strong><p>Categorie</p></div>
        <div className="stat-card"><strong>{event.matches.length}</strong><p>Partite</p></div>
        <div className="stat-card"><strong>{event.media.length}</strong><p>Media</p></div>
        <div className="stat-card"><strong>{totalMediaComments + comments.length}</strong><p>Commenti</p></div>
      </section>

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
            {event.matches.map((match) => (
              <div className="match-row" key={match.id}>
                <div>
                  <strong>{match.homeTeam} - {match.awayTeam}</strong>
                  <p className="muted">{formatDate(match.startsAt)} - {match.court} - {match.category}</p>
                </div>
                <div className="score">
                  {match.homeScore ?? "-"}:{match.awayScore ?? "-"}
                </div>
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
            <p className="muted">Da stampare o mostrare all'ingresso per aprire direttamente la sezione dedicata.</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} width={220} height={220} alt="QR code evento" />
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

      <section className="section two-grid">
        <div className="card">
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
                  {[...event.rankings].sort((a, b) => b.points - a.points).map((row, index) => (
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
            {event.feed.map((post) => (
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
          <div className="media-grid">
            {event.media.map((item) => (
              <MediaCard eventId={event.slug} item={item} comments={mediaComments[item.id] || []} key={item.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="section card" id="commenti">
        <div className="card-body">
          <span className="small-label">Discussione generale</span>
          <h2 className="icon-heading"><MessageCircle size={22} /> Commenti evento</h2>
          <CommentBox eventId={event.slug} targetType="event" targetId={event.slug} comments={comments} />
        </div>
      </section>
    </>
  );
}
