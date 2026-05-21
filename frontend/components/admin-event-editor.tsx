"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  CalendarPlus,
  Eye,
  ImagePlus,
  Radio,
  Save,
  Trash2
} from "lucide-react";
import type { Comment, EventRecord, EventStatus, FeedPost, Match, MediaItem, RankingRow } from "@/lib/types";

type Tab = "details" | "matches" | "rankings" | "media" | "feed";

const statusLabels: Record<EventStatus, string> = {
  draft: "Bozza",
  published: "Pubblicato",
  archived: "Archiviato"
};

export function AdminEventEditor({ event: initialEvent, comments }: { event: EventRecord; comments: Comment[] }) {
  const [event, setEvent] = useState(initialEvent);
  const [tab, setTab] = useState<Tab>("details");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        setMessage("Salvataggio non riuscito.");
        return;
      }

      const saved = await response.json() as EventRecord;
      setEvent(saved);
      setMessage("Salvato.");
    });
  }

  return (
    <>
      <section className="editor-topbar">
        <div className="editor-title">
          <Link className="ghost-button" href="/admin"><ArrowLeft size={17} /> Eventi</Link>
          <div>
            <span className={`status status-${event.status}`}>{statusLabels[event.status]}</span>
            <h1>{event.title}</h1>
            <p className="muted">{event.location} · {event.subtitle}</p>
          </div>
        </div>
        <div className="editor-actions">
          {message ? <span className="status done">{message}</span> : null}
          <Link className="ghost-button" href={`/events/${event.slug}`}><Eye size={17} /> Pubblico</Link>
          <button className="button" type="button" onClick={save} disabled={isPending}><Save size={17} /> Salva</button>
        </div>
      </section>

      <section className="editor-layout">
        <aside className="editor-sidebar">
          <button className={`side-tab ${tab === "details" ? "active" : ""}`} type="button" onClick={() => setTab("details")}>Dettagli</button>
          <button className={`side-tab ${tab === "matches" ? "active" : ""}`} type="button" onClick={() => setTab("matches")}>Partite</button>
          <button className={`side-tab ${tab === "rankings" ? "active" : ""}`} type="button" onClick={() => setTab("rankings")}>Classifiche</button>
          <button className={`side-tab ${tab === "media" ? "active" : ""}`} type="button" onClick={() => setTab("media")}>Foto e video</button>
          <button className={`side-tab ${tab === "feed" ? "active" : ""}`} type="button" onClick={() => setTab("feed")}>Feed live</button>
        </aside>

        <div className="editor-panel">
          {tab === "details" ? <DetailsEditor event={event} onChange={setEvent} /> : null}
          {tab === "matches" ? <MatchesEditor event={event} onChange={setEvent} /> : null}
          {tab === "rankings" ? <RankingsEditor event={event} onChange={setEvent} /> : null}
          {tab === "media" ? <MediaEditor event={event} onChange={setEvent} comments={comments} /> : null}
          {tab === "feed" ? <FeedEditor event={event} onChange={setEvent} /> : null}
        </div>
      </section>
    </>
  );
}

function DetailsEditor({ event, onChange }: EditorProps) {
  return (
    <div>
      <PanelHeader title="Dettagli evento" text="Informazioni pubbliche, stato e streaming principale." />
      <div className="form-grid">
        <Input label="Titolo" value={event.title} onChange={(title) => onChange({ ...event, title })} />
        <Input label="Slug pagina" value={event.slug} onChange={(slug) => onChange({ ...event, slug })} />
        <Input label="Sottotitolo" value={event.subtitle} onChange={(subtitle) => onChange({ ...event, subtitle })} full />
        <Input label="Luogo" value={event.location} onChange={(location) => onChange({ ...event, location })} />
        <label className="field">
          <span>Stato</span>
          <select value={event.status} onChange={(input) => onChange({ ...event, status: input.target.value as EventStatus })}>
            <option value="draft">Bozza</option>
            <option value="published">Pubblicato</option>
            <option value="archived">Archiviato</option>
          </select>
        </label>
        <Input label="Inizio" type="datetime-local" value={toLocalInput(event.startsAt)} onChange={(startsAt) => onChange({ ...event, startsAt: toIso(startsAt) })} />
        <Input label="Fine" type="datetime-local" value={toLocalInput(event.endsAt)} onChange={(endsAt) => onChange({ ...event, endsAt: toIso(endsAt) })} />
        <Input label="Categorie" value={event.categories.join(", ")} onChange={(categories) => onChange({ ...event, categories: splitList(categories) })} full />
        <AssetInput label="Immagine copertina" value={event.coverImage} onChange={(coverImage) => onChange({ ...event, coverImage })} full />
        <AssetInput label="Logo" value={event.logoImage} onChange={(logoImage) => onChange({ ...event, logoImage })} full />
        <Input label="Streaming embed URL" value={event.streamUrl || ""} onChange={(streamUrl) => onChange({ ...event, streamUrl })} full />
        <label className="field full">
          <span>Descrizione</span>
          <textarea value={event.description} onChange={(input) => onChange({ ...event, description: input.target.value })} />
        </label>
      </div>
    </div>
  );
}

function MatchesEditor({ event, onChange }: EditorProps) {
  function addMatch() {
    const match: Match = {
      id: crypto.randomUUID(),
      category: event.categories[0] || "Categoria",
      homeTeam: "Squadra casa",
      awayTeam: "Squadra ospite",
      court: "Campo",
      startsAt: new Date().toISOString(),
      status: "scheduled"
    };
    onChange({ ...event, matches: [...event.matches, match] });
  }

  function patchMatch(id: string, patch: Partial<Match>) {
    onChange({ ...event, matches: event.matches.map((match) => (match.id === id ? { ...match, ...patch } : match)) });
  }

  function removeMatch(id: string) {
    onChange({ ...event, matches: event.matches.filter((match) => match.id !== id) });
  }

  return (
    <div>
      <PanelHeader title="Partite" text="Calendario, score e stato live." action={<button className="button" type="button" onClick={addMatch}><CalendarPlus size={17} /> Aggiungi</button>} />
      <div className="stack">
        {event.matches.length === 0 ? <div className="empty">Nessuna partita inserita.</div> : null}
        {event.matches.map((match) => (
          <div className={`editor-item match-editor-card status-card-${match.status}`} key={match.id}>
            <div className="item-toolbar">
              <div>
                <span className={`status ${match.status === "live" ? "live" : match.status === "finished" ? "done" : ""}`}>
                  {match.status === "scheduled" ? "In programma" : match.status === "live" ? "Live" : match.status === "finished" ? "Finita" : "Rinviata"}
                </span>
                <strong>{match.homeTeam} - {match.awayTeam}</strong>
                <p className="muted">{match.category} · {match.court}</p>
              </div>
              <button className="icon-danger" type="button" onClick={() => removeMatch(match.id)} aria-label="Elimina partita"><Trash2 size={17} /></button>
            </div>
            <div className="form-grid compact">
              <Input label="Categoria" value={match.category} onChange={(category) => patchMatch(match.id, { category })} />
              <Input label="Campo" value={match.court} onChange={(court) => patchMatch(match.id, { court })} />
              <Input label="Squadra casa" value={match.homeTeam} onChange={(homeTeam) => patchMatch(match.id, { homeTeam })} />
              <Input label="Squadra ospite" value={match.awayTeam} onChange={(awayTeam) => patchMatch(match.id, { awayTeam })} />
              <Input label="Inizio" type="datetime-local" value={toLocalInput(match.startsAt)} onChange={(startsAt) => patchMatch(match.id, { startsAt: toIso(startsAt) })} />
              <label className="field">
                <span>Stato partita</span>
                <select value={match.status} onChange={(input) => patchMatch(match.id, { status: input.target.value as Match["status"] })}>
                  <option value="scheduled">In programma</option>
                  <option value="live">Live</option>
                  <option value="finished">Finita</option>
                  <option value="postponed">Rinviata</option>
                </select>
              </label>
              <Input label="Punti casa" type="number" value={String(match.homeScore ?? "")} onChange={(homeScore) => patchMatch(match.id, { homeScore: Number(homeScore) })} />
              <Input label="Punti ospite" type="number" value={String(match.awayScore ?? "")} onChange={(awayScore) => patchMatch(match.id, { awayScore: Number(awayScore) })} />
              <Input label="Streaming partita" value={match.streamUrl || ""} onChange={(streamUrl) => patchMatch(match.id, { streamUrl })} full />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingsEditor({ event, onChange }: EditorProps) {
  const columns = getRankingColumns(event);

  function importTable(raw: string) {
    const parsed = parseRankingPaste(raw);
    if (!parsed) return;
    onChange({ ...event, rankingColumns: parsed.columns, rankings: parsed.rows });
  }

  function clearTable() {
    onChange({ ...event, rankingColumns: [], rankings: [] });
  }

  return (
    <div>
      <PanelHeader title="Classifiche" text="Incolla direttamente da Excel o Google Sheets: prima riga intestazioni, righe successive squadre e valori." />
      <div className="stack">
        <div className="paste-panel">
          <label className="field full">
            <span>Incolla tabella classifica</span>
            <textarea
              className="ranking-paste"
              placeholder={"SQUADRE\tGIOCATE\tPUNTI\tSET VINTI\tSET PERSI\tQUOZ SET\tPUNTI FATTI\tPUNTI SUBITI\tQUOZ PUNTI\nPGS DOMANI PESSANO BLU\t2\t6\t4\t1\t4\t105\t75\t1.4"}
              onPaste={(input) => {
                input.preventDefault();
                const text = input.clipboardData.getData("text");
                input.currentTarget.value = text;
                importTable(text);
              }}
              onBlur={(input) => importTable(input.currentTarget.value)}
            />
          </label>
          <div className="toolbar">
            <button className="ghost-button" type="button" onClick={clearTable}><Trash2 size={17} /> Svuota classifica</button>
            <span className="muted">{event.rankings.length} righe importate</span>
          </div>
        </div>

        {event.rankings.length === 0 ? <div className="empty">Nessuna classifica importata.</div> : (
          <RankingPreview columns={columns} rows={event.rankings} />
        )}
      </div>
    </div>
  );
}

function MediaEditor({ event, onChange, comments }: EditorProps & { comments: Comment[] }) {
  function patchMedia(id: string, patch: Partial<MediaItem>) {
    onChange({ ...event, media: event.media.map((item) => (item.id === id ? { ...item, ...patch } : item)) });
  }

  function removeMedia(id: string) {
    onChange({ ...event, media: event.media.filter((item) => item.id !== id) });
  }

  async function uploadMedia(files: FileList | null) {
    if (!files?.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("file", file));

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: formData
    });

    if (!response.ok) return;

    const result = await response.json() as { files: Array<{ url: string; type: MediaItem["type"]; name: string }> };
    const now = new Date().toISOString();
    const newMedia = result.files.map((file) => ({
      id: crypto.randomUUID(),
      type: file.type,
      title: file.name.replace(/\.[^.]+$/, ""),
      url: file.url,
      caption: "",
      commentsEnabled: true,
      likes: 0,
      createdAt: now
    } satisfies MediaItem));

    onChange({ ...event, media: [...newMedia, ...event.media] });
  }

  return (
    <div>
      <PanelHeader title="Foto e video" text="Carica una o piu foto/video. Ogni contenuto potra ricevere like e commenti." />
      <div className="stack">
        <label className="media-upload-dropzone">
          <ImagePlus size={22} />
          <strong>Carica foto o video</strong>
          <span>Puoi selezionare piu file insieme. Aggiungi poi la didascalia.</span>
          <input type="file" accept="image/*,video/*" multiple onChange={(input) => uploadMedia(input.target.files)} />
        </label>
        {event.media.length === 0 ? <div className="empty">Nessun contenuto media.</div> : null}
        {event.media.map((item) => (
          <div className="editor-item" key={item.id}>
            <div className="item-toolbar">
              <div className="media-editor-heading">
                <MediaPreview item={item} />
                <div>
                  <strong>{item.title || "Media"}</strong>
                  <div className="media-admin-stats">
                    <span>{item.type === "video" ? "Video" : "Foto"}</span>
                    <span>{item.likes || 0} like</span>
                    <span>{comments.filter((comment) => comment.targetType === "media" && comment.targetId === item.id).length} commenti</span>
                  </div>
                </div>
              </div>
              <button className="icon-danger" type="button" onClick={() => removeMedia(item.id)} aria-label="Elimina media"><Trash2 size={17} /></button>
            </div>
            <div className="form-grid compact media-simple-form">
              <Input label="Didascalia" value={item.caption || ""} onChange={(caption) => patchMedia(item.id, { caption })} full />
              <label className="toggle-field full">
                <input type="checkbox" checked={item.commentsEnabled} onChange={(input) => patchMedia(item.id, { commentsEnabled: input.target.checked })} />
                <span>Commenti abilitati</span>
              </label>
            </div>
            <MediaCommentPreview comments={comments.filter((comment) => comment.targetType === "media" && comment.targetId === item.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaPreview({ item }: { item: MediaItem }) {
  if (item.type === "video") {
    return <video className="media-editor-preview" src={item.url} muted controls />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="media-editor-preview" src={item.url} alt={item.title} />
  );
}

function MediaCommentPreview({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return <div className="media-comment-preview empty">Nessun commento su questo contenuto.</div>;
  }

  return (
    <div className="media-comment-preview">
      <strong>Ultimi commenti</strong>
      {comments.slice(0, 3).map((comment) => (
        <article key={comment.id}>
          <span>{comment.authorName}</span>
          <p>{comment.body}</p>
        </article>
      ))}
    </div>
  );
}

function RankingPreview({ columns, rows }: { columns: string[]; rows: RankingRow[] }) {
  return (
    <div className="ranking-table-wrap admin-ranking-preview">
      <table className="ranking-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column} data-label={column}>{getRankingCell(row, column)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseRankingPaste(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  const delimiter = lines[0].includes("\t") ? "\t" : /;/.test(lines[0]) ? ";" : ",";
  const columns = lines[0].split(delimiter).map(normalizeHeader).filter(Boolean);

  if (columns.length < 2) return null;

  const rows = lines.slice(1).map((line) => {
    const values = line.split(delimiter).map((value) => cleanRankingValue(value));
    const record = Object.fromEntries(columns.map((column, index) => [column, values[index] || ""]));
    const team = record.SQUADRE || record.SQUADRA || record.TEAM || values[0] || "Squadra";
    const points = Number.parseFloat(record.PUNTI || "0") || 0;
    const played = Number.parseFloat(record.GIOCATE || "0") || 0;

    return {
      id: crypto.randomUUID(),
      category: "Generale",
      team,
      played,
      wins: 0,
      losses: 0,
      points,
      values: record
    } satisfies RankingRow;
  });

  return { columns, rows };
}

function normalizeHeader(value: string) {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

function cleanRankingValue(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  const numberValue = Number(trimmed.replace(",", "."));

  if (!Number.isFinite(numberValue) || trimmed === "") {
    return trimmed;
  }

  if (Math.abs(numberValue) < 1 && trimmed.length > 5) {
    return numberValue.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
  }

  return trimmed;
}

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

function FeedEditor({ event, onChange }: EditorProps) {
  function addPost() {
    const post: FeedPost = {
      id: crypto.randomUUID(),
      eventId: event.slug,
      title: "Aggiornamento live",
      body: "Nuovo aggiornamento dalla manifestazione.",
      type: "announcement",
      createdAt: new Date().toISOString()
    };
    onChange({ ...event, feed: [post, ...event.feed] });
  }

  function patchPost(id: string, patch: Partial<FeedPost>) {
    onChange({ ...event, feed: event.feed.map((post) => (post.id === id ? { ...post, ...patch } : post)) });
  }

  function removePost(id: string) {
    onChange({ ...event, feed: event.feed.filter((post) => post.id !== id) });
  }

  return (
    <div>
      <PanelHeader title="Feed live" text="Post operativi e annunci che compaiono nella pagina pubblica." action={<button className="button" type="button" onClick={addPost}><Radio size={17} /> Post</button>} />
      <div className="stack">
        {event.feed.length === 0 ? <div className="empty">Nessun post pubblicato.</div> : null}
        {event.feed.map((post) => (
          <div className="editor-item" key={post.id}>
            <div className="item-toolbar">
              <strong>{post.title}</strong>
              <button className="icon-danger" type="button" onClick={() => removePost(post.id)} aria-label="Elimina post"><Trash2 size={17} /></button>
            </div>
            <div className="form-grid compact">
              <Input label="Titolo" value={post.title} onChange={(title) => patchPost(post.id, { title })} />
              <label className="field">
                <span>Tipo</span>
                <select value={post.type} onChange={(input) => patchPost(post.id, { type: input.target.value as FeedPost["type"] })}>
                  <option value="announcement">Annuncio</option>
                  <option value="ranking">Classifica</option>
                  <option value="media">Media</option>
                  <option value="live">Live</option>
                </select>
              </label>
              <label className="field full">
                <span>Testo</span>
                <textarea value={post.body} onChange={(input) => patchPost(post.id, { body: input.target.value })} />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type EditorProps = {
  event: EventRecord;
  onChange: (event: EventRecord) => void;
};

function PanelHeader({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        <p className="muted">{text}</p>
      </div>
      {action}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", full = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; full?: boolean }) {
  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span>{label}</span>
      <input type={type} value={value} onChange={(input) => onChange(input.target.value)} />
    </label>
  );
}

function AssetInput({ label, value, onChange, full = false }: { label: string; value: string; onChange: (value: string) => void; full?: boolean }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(file?: File) {
    if (!file) return;

    setIsUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: formData
    });

    setIsUploading(false);

    if (!response.ok) {
      setMessage("Caricamento non riuscito.");
      return;
    }

    const result = await response.json() as { url: string };
    onChange(result.url);
  }

  return (
    <div className={`field asset-field ${full ? "full" : ""}`}>
      <span>{label}</span>
      <div className="asset-picker">
        <div className="asset-preview">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} />
          ) : (
            <span>Nessuna immagine</span>
          )}
        </div>
        <div className="asset-controls">
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(input) => upload(input.target.files?.[0])}
          />
          <div className="asset-actions">
            <button className="ghost-button" type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
              {isUploading ? "Caricamento..." : "Scegli immagine"}
            </button>
            {value ? <button className="ghost-button" type="button" onClick={() => onChange("")}>Rimuovi</button> : null}
          </div>
          <label className="field compact-url">
            <span>URL immagine</span>
            <input value={value} onChange={(input) => onChange(input.target.value)} placeholder="/uploads/immagine.jpg" />
          </label>
          {message ? <span className="muted">{message}</span> : null}
        </div>
      </div>
    </div>
  );
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

function toLocalInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}
