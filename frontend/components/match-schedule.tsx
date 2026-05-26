"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Search, Trophy } from "lucide-react";
import type { EventField, Match, MatchStatus } from "@/lib/types";
import type { CSSProperties } from "react";

const statusLabels: Record<MatchStatus, string> = {
  scheduled: "In programma",
  live: "Live",
  finished: "Finita",
  postponed: "Rinviata"
};

const pageSize = 8;

export function MatchSchedule({ matches, fields }: { matches: Match[]; fields: EventField[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const groupSort = getGironeLabel(a).localeCompare(getGironeLabel(b), "it");
      if (groupSort !== 0) return groupSort;
      const dateSort = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      if (dateSort !== 0) return dateSort;
      return `${a.homeTeam} ${a.awayTeam}`.localeCompare(`${b.homeTeam} ${b.awayTeam}`, "it");
    });
  }, [matches]);

  const filteredMatches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sortedMatches;

    return sortedMatches.filter((match) => {
      const haystack = [
        match.homeTeam,
        match.awayTeam,
        match.court,
        match.category,
        statusLabels[match.status],
        formatDate(match.startsAt)
      ].join(" ").toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query, sortedMatches]);

  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / pageSize));
  const visibleMatches = filteredMatches.slice((page - 1) * pageSize, page * pageSize);
  const groupedMatches = groupByGirone(visibleMatches);
  const legendGroups = useMemo(() => getLegendGroups(sortedMatches), [sortedMatches]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="match-schedule">
      <div className="match-schedule-controls">
        <label className="schedule-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca squadra, campo, girone..."
          />
        </label>
        <div className="schedule-count">
          <strong>{filteredMatches.length}</strong>
          <span>{filteredMatches.length === 1 ? "partita" : "partite"}</span>
        </div>
      </div>

      {matches.length === 0 ? <div className="empty">Nessuna partita inserita.</div> : null}
      {matches.length > 0 && filteredMatches.length === 0 ? <div className="empty">Nessuna partita trovata.</div> : null}
      {legendGroups.length > 0 ? (
        <div className="schedule-legend" aria-label="Legenda gironi e squadre">
          {legendGroups.map((group) => {
            const colors = getGironeColors(group.girone);

            return (
              <div
                className="schedule-legend-item"
                style={{
                  "--girone-bg": colors.background,
                  "--girone-border": colors.border,
                  "--girone-color": colors.text
                } as CSSProperties}
                key={group.girone}
              >
                <span className="schedule-legend-swatch" />
                <div>
                  <strong>{group.girone}</strong>
                  <small>{group.teams.join(", ")}</small>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="schedule-groups">
        {groupedMatches.map(([girone, items]) => {
          const colors = getGironeColors(girone);

          return (
            <section className="schedule-group" key={girone}>
              <div
                className="schedule-group-header"
                style={{
                  "--girone-bg": colors.background,
                  "--girone-border": colors.border,
                  "--girone-color": colors.text,
                  "--girone-muted": colors.muted
                } as CSSProperties}
              >
                <span><Trophy size={15} /> {girone}</span>
                <small>{items.length} {items.length === 1 ? "partita" : "partite"}</small>
              </div>
              <div className="schedule-match-list">
                {items.map((match) => (
                  <article className="schedule-match-card" key={match.id}>
                    <div className="schedule-match-main">
                      <strong>{match.homeTeam} - {match.awayTeam}</strong>
                      <div className="match-meta">
                        <span><CalendarDays size={14} /> {formatDate(match.startsAt)}</span>
                        <FieldMapLink court={match.court} fields={fields} />
                      </div>
                    </div>
                    <div className="schedule-match-side">
                      <div className="schedule-match-score">{match.homeScore ?? "-"}:{match.awayScore ?? "-"}</div>
                      <span className={`status ${match.status === "live" ? "live" : match.status === "finished" ? "done" : ""}`}>
                        {statusLabels[match.status]}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {filteredMatches.length > pageSize ? (
        <div className="schedule-pagination">
          <button className="ghost-button" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>
            <ChevronLeft size={17} /> Precedente
          </button>
          <span>Pagina {page} di {totalPages}</span>
          <button className="ghost-button" type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>
            Successiva <ChevronRight size={17} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function groupByGirone(matches: Match[]) {
  const groups = new Map<string, Match[]>();

  for (const match of matches) {
    const girone = getGironeLabel(match);
    groups.set(girone, [...(groups.get(girone) || []), match]);
  }

  return [...groups.entries()];
}

function getLegendGroups(matches: Match[]) {
  const groups = new Map<string, Set<string>>();

  for (const match of matches) {
    const girone = getGironeLabel(match);
    const teams = groups.get(girone) || new Set<string>();
    teams.add(match.homeTeam);
    teams.add(match.awayTeam);
    groups.set(girone, teams);
  }

  return [...groups.entries()].map(([girone, teams]) => ({
    girone,
    teams: [...teams].sort((a, b) => a.localeCompare(b, "it"))
  }));
}

function getGironeLabel(match: Match) {
  return match.category?.trim() || "Senza girone";
}

function FieldMapLink({ court, fields }: { court: string; fields: EventField[] }) {
  const field = fields.find((item) => item.name.trim().toLowerCase() === court.trim().toLowerCase());
  const mapUrl = getFieldMapUrl(field);

  if (!mapUrl) {
    return <span><MapPin size={14} /> {court || "Campo non definito"}</span>;
  }

  return (
    <a className="match-field-link" href={mapUrl} target="_blank" rel="noreferrer">
      <MapPin size={14} /> {court}
    </a>
  );
}

function getFieldMapUrl(field?: EventField) {
  if (!field) return "";
  if (field.mapUrl?.trim()) return field.mapUrl.trim();
  if (!field.address.trim()) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(field.address.trim())}`;
}

function getGironeColors(label: string) {
  const normalized = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const colorOptions = [
    { words: ["arancio", "arancione"], background: "#fff3e6", border: "#ffd7a8", text: "#8a3f00", muted: "#9a5b00" },
    { words: ["rosso", "rossa"], background: "#fff1f3", border: "#fecdd6", text: "#a31717", muted: "#b42318" },
    { words: ["blu", "azzurro", "azzurra"], background: "#eaf4ff", border: "#bfdcff", text: "#15427f", muted: "#24589c" },
    { words: ["verde"], background: "#eafaf5", border: "#b7ead8", text: "#086044", muted: "#127456" },
    { words: ["giallo", "gialla"], background: "#fff9db", border: "#fde68a", text: "#7a4b00", muted: "#936400" },
    { words: ["viola", "lilla"], background: "#f5f0ff", border: "#d8c7ff", text: "#58329b", muted: "#6941c6" },
    { words: ["rosa"], background: "#fff0f6", border: "#fbcfe8", text: "#9d174d", muted: "#be185d" },
    { words: ["bianco", "bianca"], background: "#f8fafc", border: "#d7e2f1", text: "#344054", muted: "#667085" },
    { words: ["nero", "nera"], background: "#eef2f6", border: "#cfd7e3", text: "#1d2939", muted: "#475467" },
    { words: ["grigio", "grigia"], background: "#f2f4f7", border: "#d0d5dd", text: "#344054", muted: "#667085" }
  ];

  return colorOptions.find((option) => option.words.some((word) => normalized.includes(word))) || {
    background: "#eaf4ff",
    border: "#bfdcff",
    text: "#15427f",
    muted: "#475467"
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
