"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  CalendarPlus,
  Eye,
  ImagePlus,
  PartyPopper,
  Plus,
  Radio,
  Save,
  Trophy,
  Trash2
} from "lucide-react";
import type { Comment, EventRecord, EventSection, EventSectionType, EventStatus, FeedPost, Match, MediaItem, ProgramItem, RankingRow } from "@/lib/types";

type Tab = "details" | "sections" | "matches" | "rankings" | "media" | "feed";

const statusLabels: Record<EventStatus, string> = {
  draft: "Bozza",
  published: "Pubblicato",
  archived: "Archiviato"
};

export function AdminEventEditor({ event: initialEvent, comments }: { event: EventRecord; comments: Comment[] }) {
  const [event, setEvent] = useState(() => normalizeEventSections(initialEvent));
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
          <button className={`side-tab ${tab === "sections" ? "active" : ""}`} type="button" onClick={() => setTab("sections")}>Eventi interni</button>
          <button className={`side-tab ${tab === "matches" ? "active" : ""}`} type="button" onClick={() => setTab("matches")}>Partite</button>
          <button className={`side-tab ${tab === "rankings" ? "active" : ""}`} type="button" onClick={() => setTab("rankings")}>Classifiche</button>
          <button className={`side-tab ${tab === "media" ? "active" : ""}`} type="button" onClick={() => setTab("media")}>Foto e video</button>
          <button className={`side-tab ${tab === "feed" ? "active" : ""}`} type="button" onClick={() => setTab("feed")}>Feed live</button>
        </aside>

        <div className="editor-panel">
          {tab === "details" ? <DetailsEditor event={event} onChange={setEvent} /> : null}
          {tab === "sections" ? <SectionsEditor event={event} onChange={setEvent} /> : null}
          {tab === "matches" ? <MatchesEditor event={event} onChange={setEvent} /> : null}
          {tab === "rankings" ? <RankingsEditor event={event} onChange={setEvent} /> : null}
          {tab === "media" ? <MediaEditor event={event} onChange={setEvent} comments={comments} /> : null}
          {tab === "feed" ? <FeedEditor event={event} onChange={setEvent} /> : null}
        </div>
      </section>
    </>
  );
}

function SectionsEditor({ event, onChange }: EditorProps) {
  const sections = getEditableSections(event);

  function addSection(type: EventSectionType) {
    const title = type === "campionato" ? "Nuovo campionato" : "Nuovo intrattenimento";
    const section: EventSection = {
      id: crypto.randomUUID(),
      slug: slugify(title),
      type,
      title,
      subtitle: type === "campionato" ? "Partite, risultati e classifiche" : "Programma e informazioni per il pubblico",
      description: "",
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
      heroImage: event.coverImage,
      programItems: type === "intrattenimento" ? [] : undefined
    };

    onChange({ ...event, sections: [...sections, section] });
  }

  function patchSection(id: string, patch: Partial<EventSection>) {
    onChange({
      ...event,
      sections: sections.map((section) => (section.id === id ? { ...section, ...patch } : section))
    });
  }

  function removeSection(id: string) {
    onChange({ ...event, sections: sections.filter((section) => section.id !== id) });
  }

  function addProgramItem(section: EventSection) {
    const item: ProgramItem = {
      id: crypto.randomUUID(),
      time: "20:00",
      title: "Nuovo punto programma",
      description: "",
      location: section.location || event.location
    };
    patchSection(section.id, { programItems: [...(section.programItems || []), item] });
  }

  function patchProgramItem(section: EventSection, itemId: string, patch: Partial<ProgramItem>) {
    patchSection(section.id, {
      programItems: (section.programItems || []).map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    });
  }

  function removeProgramItem(section: EventSection, itemId: string) {
    patchSection(section.id, { programItems: (section.programItems || []).filter((item) => item.id !== itemId) });
  }

  return (
    <div>
      <PanelHeader
        title="Eventi interni"
        text="Organizza la manifestazione principale in sezioni: campionato per gare/classifiche e intrattenimento per serate, cerimonie o momenti pubblici."
        action={(
          <div className="toolbar section-actions">
            <button className="ghost-button" type="button" onClick={() => addSection("campionato")}><Trophy size={17} /> Campionato</button>
            <button className="button" type="button" onClick={() => addSection("intrattenimento")}><PartyPopper size={17} /> Intrattenimento</button>
          </div>
        )}
      />
      <div className="stack">
        {sections.length === 0 ? <div className="empty">Nessun evento interno configurato.</div> : null}
        {sections.map((section) => (
          <div className={`editor-item section-editor-card section-editor-${section.type}`} key={section.id}>
            <div className="item-toolbar">
              <div>
                <span className="status">
                  {section.type === "campionato" ? <Trophy size={14} /> : <PartyPopper size={14} />}
                  {section.type === "campionato" ? "Campionato" : "Intrattenimento"}
                </span>
                <strong>{section.title}</strong>
                <p className="muted">{section.subtitle || "Sezione della manifestazione"}</p>
              </div>
              <button className="icon-danger" type="button" onClick={() => removeSection(section.id)} aria-label="Elimina evento interno"><Trash2 size={17} /></button>
            </div>

            <div className="form-grid compact">
              <label className="field">
                <span>Tipo</span>
                <select
                  value={section.type}
                  onChange={(input) => {
                    const type = input.target.value as EventSectionType;
                    patchSection(section.id, {
                      type,
                      programItems: type === "intrattenimento" ? section.programItems || [] : undefined
                    });
                  }}
                >
                  <option value="campionato">Campionato</option>
                  <option value="intrattenimento">Intrattenimento</option>
                </select>
              </label>
              <Input label="Titolo" value={section.title} onChange={(title) => patchSection(section.id, { title, slug: section.slug || slugify(title) })} />
              <Input label="Slug sezione" value={section.slug} onChange={(slug) => patchSection(section.id, { slug: slugify(slug) || slug })} />
              <Input label="Luogo" value={section.location || ""} onChange={(location) => patchSection(section.id, { location })} />
              <Input label="Inizio" type="datetime-local" value={toLocalInput(section.startsAt || event.startsAt)} onChange={(startsAt) => patchSection(section.id, { startsAt: toIso(startsAt) })} />
              <Input label="Fine" type="datetime-local" value={toLocalInput(section.endsAt || event.endsAt)} onChange={(endsAt) => patchSection(section.id, { endsAt: toIso(endsAt) })} />
              <Input label="Sottotitolo" value={section.subtitle || ""} onChange={(subtitle) => patchSection(section.id, { subtitle })} full />
              <AssetInput label="Immagine hero / sfondo" value={section.heroImage || ""} onChange={(heroImage) => patchSection(section.id, { heroImage })} full />
              <label className="field full">
                <span>Descrizione</span>
                <textarea value={section.description || ""} onChange={(input) => patchSection(section.id, { description: input.target.value })} />
              </label>
            </div>

            {section.type === "intrattenimento" ? (
              <div className="program-editor">
                <div className="section-title-row">
                  <div>
                    <span className="small-label">Programma</span>
                    <h3>Scaletta serata</h3>
                  </div>
                  <button className="ghost-button" type="button" onClick={() => addProgramItem(section)}><Plus size={17} /> Punto programma</button>
                </div>
                {(section.programItems || []).length === 0 ? <div className="empty">Aggiungi orari, titoli e dettagli della serata.</div> : null}
                {(section.programItems || []).map((item) => (
                  <div className="program-editor-row" key={item.id}>
                    <Input label="Ora" value={item.time} onChange={(time) => patchProgramItem(section, item.id, { time })} />
                    <Input label="Titolo" value={item.title} onChange={(title) => patchProgramItem(section, item.id, { title })} />
                    <Input label="Luogo" value={item.location || ""} onChange={(location) => patchProgramItem(section, item.id, { location })} />
                    <button className="icon-danger" type="button" onClick={() => removeProgramItem(section, item.id)} aria-label="Elimina punto programma"><Trash2 size={17} /></button>
                    <label className="field full">
                      <span>Descrizione</span>
                      <textarea value={item.description || ""} onChange={(input) => patchProgramItem(section, item.id, { description: input.target.value })} />
                    </label>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
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
  const campionatoSections = getCampionatoSections(event);

  function addMatch() {
    const match: Match = {
      id: crypto.randomUUID(),
      sectionId: campionatoSections[0]?.id,
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
              <SectionSelect
                label="Campionato"
                value={match.sectionId || ""}
                sections={campionatoSections}
                onChange={(sectionId) => patchMatch(match.id, { sectionId })}
              />
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
  const campionatoSections = getCampionatoSections(event);
  const [selectedSectionId, setSelectedSectionId] = useState(campionatoSections[0]?.id || "");
  const columns = getRankingColumns(event);

  function importTable(raw: string) {
    const parsed = parseRankingPaste(raw);
    if (!parsed) return;
    onChange({ ...event, rankingColumns: parsed.columns, rankings: parsed.rows.map((row) => ({ ...row, sectionId: selectedSectionId || undefined })) });
  }

  function clearTable() {
    onChange({ ...event, rankingColumns: [], rankings: [] });
  }

  return (
    <div>
      <PanelHeader title="Classifiche" text="Incolla direttamente da Excel o Google Sheets: prima riga intestazioni, righe successive squadre e valori." />
      <div className="stack">
        <div className="paste-panel">
          <SectionSelect
            label="Classifica relativa a"
            value={selectedSectionId}
            sections={campionatoSections}
            onChange={(sectionId) => setSelectedSectionId(sectionId || "")}
            full
          />
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
  const campionatoSections = getCampionatoSections(event);

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
      sectionId: campionatoSections[0]?.id,
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
              <SectionSelect
                label="Campionato"
                value={item.sectionId || ""}
                sections={campionatoSections}
                onChange={(sectionId) => patchMedia(item.id, { sectionId })}
                full
              />
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
  const campionatoSections = getCampionatoSections(event);

  function addPost() {
    const post: FeedPost = {
      id: crypto.randomUUID(),
      eventId: event.slug,
      sectionId: campionatoSections[0]?.id,
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
              <SectionSelect
                label="Campionato"
                value={post.sectionId || ""}
                sections={campionatoSections}
                onChange={(sectionId) => patchPost(post.id, { sectionId })}
              />
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

function SectionSelect({
  label,
  value,
  sections,
  onChange,
  full = false
}: {
  label: string;
  value: string;
  sections: EventSection[];
  onChange: (value: string | undefined) => void;
  full?: boolean;
}) {
  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span>{label}</span>
      <select value={value} onChange={(input) => onChange(input.target.value || undefined)}>
        <option value="">Primo campionato / generale</option>
        {sections.map((section) => (
          <option value={section.id} key={section.id}>{section.title}</option>
        ))}
      </select>
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

function normalizeEventSections(event: EventRecord): EventRecord {
  return { ...event, sections: getEditableSections(event) };
}

function getEditableSections(event: EventRecord): EventSection[] {
  if (event.sections?.length) return event.sections;

  return [
    {
      id: crypto.randomUUID(),
      slug: "campionato",
      type: "campionato",
      title: "Campionato",
      subtitle: "Partite, risultati e classifiche",
      description: "Sezione sportiva con calendario, classifiche e aggiornamenti live.",
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
      heroImage: event.coverImage
    }
  ];
}

function getCampionatoSections(event: EventRecord) {
  return getEditableSections(event).filter((section) => section.type === "campionato");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
