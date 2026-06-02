"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Eye, FilePenLine, Radio, Search, Trash2, Trophy, Video } from "lucide-react";
import { createDraftEvent } from "@/lib/event-template";
import type { EventRecord, EventStatus } from "@/lib/types";

const statusLabels: Record<EventStatus, string> = {
  draft: "Bozza",
  updating: "In lavorazione",
  published: "Pubblicato",
  completed: "Completato",
  archived: "Archiviato"
};

const statusOptions: EventStatus[] = ["draft", "updating", "published", "completed", "archived"];

export function AdminWorkspace({ events: initialEvents }: { events: EventRecord[] }) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesStatus = statusFilter === "all" || event.status === statusFilter;
      const matchesText = `${event.title} ${event.subtitle} ${event.location}`.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesText;
    });
  }, [events, query, statusFilter]);

  const metrics = useMemo(() => ({
    total: events.length,
    live: events.filter((event) => event.matches.some((match) => match.status === "live")).length,
    published: events.filter((event) => event.status === "published").length,
    completed: events.filter((event) => event.status === "completed").length,
    updating: events.filter((event) => event.status === "updating").length,
    drafts: events.filter((event) => event.status === "draft").length
  }), [events]);

  function createEvent() {
    startCreate(async () => {
      const draft = createDraftEvent();
      const saved = await saveEvent(draft);
      setEvents((items) => [saved, ...items]);
      router.push(`/admin/events/${saved.slug}`);
    });
  }

  async function changeStatus(event: EventRecord, status: EventStatus) {
    setPendingSlug(event.slug);
    const updated = await saveEvent({ ...event, status });
    setEvents((items) => items.map((item) => (item.slug === event.slug ? updated : item)));
    setPendingSlug(null);
  }

  async function deleteEvent(event: EventRecord) {
    if (confirmDeleteSlug !== event.slug) {
      setConfirmDeleteSlug(event.slug);
      return;
    }

    setPendingSlug(event.slug);
    await deleteSavedEvent(event._id || event.slug);
    setEvents((items) => items.filter((item) => item.slug !== event.slug));
    setPendingSlug(null);
    setConfirmDeleteSlug(null);
  }

  return (
    <>
      <section className="admin-hero">
        <div>
          <span className="kicker"><Radio size={16} /> Centro operativo</span>
          <h1>Eventi</h1>
          <p className="lead">Controlla lo stato degli eventi, entra nella regia live e aggiorna contenuti senza perdere tempo.</p>
        </div>
        <button className="button admin-primary-action" type="button" onClick={createEvent} disabled={isCreating}>
          <CalendarPlus size={18} /> Nuovo evento
        </button>
      </section>

      <section className="admin-metrics">
        <Metric label="Eventi" value={metrics.total} />
        <Metric label="Pubblicati" value={metrics.published} />
        <Metric label="Completati" value={metrics.completed} />
        <Metric label="In lavorazione" value={metrics.updating} />
        <Metric label="Bozze" value={metrics.drafts} />
        <Metric label="Live ora" value={metrics.live} />
      </section>

      <section className="admin-panel">
        <div className="admin-list-header">
          <div>
            <h2>Eventi in lavorazione</h2>
            <p className="muted">Cambia stato al volo o apri la pagina evento per calendario, classifiche, post e media.</p>
          </div>
          <div className="admin-filters">
            <label className="search-field">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca evento" />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | EventStatus)}>
              <option value="all">Tutti gli stati</option>
              <option value="draft">Bozze</option>
              <option value="updating">In lavorazione</option>
              <option value="published">Pubblicati</option>
              <option value="completed">Completati</option>
              <option value="archived">Archiviati</option>
            </select>
          </div>
        </div>

        <div className="event-table">
          {filteredEvents.length === 0 ? (
            <div className="empty">Nessun evento trovato.</div>
          ) : null}
          {filteredEvents.map((event) => (
            <article className="event-row" key={event.slug}>
              <Image className="event-row-image" src={event.coverImage} width={96} height={96} alt={event.title} />
              <div className="event-row-main">
                <div className="event-row-title">
                  <h3>{event.title}</h3>
                  <span className={`status status-${event.status}`}>{statusLabels[event.status]}</span>
                </div>
                <p className="muted">{event.subtitle}</p>
                <div className="event-row-stats">
                  <span><CalendarPlus size={15} /> {event.matches.length} partite</span>
                  <span><Radio size={15} /> {event.sections?.length || 1} eventi interni</span>
                  <span><Trophy size={15} /> {event.rankings.length} righe classifica</span>
                  <span><Video size={15} /> {event.media.length} media</span>
                </div>
              </div>
              <div className="event-row-actions">
                <label className="compact-field">
                  <span>Stato</span>
                  <select
                    value={event.status}
                    disabled={pendingSlug === event.slug}
                    onChange={(input) => changeStatus(event, input.target.value as EventStatus)}
                  >
                    {statusOptions.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}
                  </select>
                </label>
                <Link className="ghost-button" href={`/events/${event.slug}`}><Eye size={17} /> Pubblico</Link>
                <Link className="button" href={`/admin/events/${event.slug}`}><FilePenLine size={17} /> Gestisci</Link>
                <button
                  className={confirmDeleteSlug === event.slug ? "danger-button" : "ghost-button danger-ghost"}
                  type="button"
                  disabled={pendingSlug === event.slug}
                  onClick={() => deleteEvent(event)}
                >
                  <Trash2 size={17} /> {confirmDeleteSlug === event.slug ? "Conferma elimina" : "Elimina"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

async function saveEvent(event: EventRecord) {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    throw new Error("Event save failed");
  }

  return await response.json() as EventRecord;
}

async function deleteSavedEvent(id: string) {
  const response = await fetch(`/api/events/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Event delete failed");
  }
}
