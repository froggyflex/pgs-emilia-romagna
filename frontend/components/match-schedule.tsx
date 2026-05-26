"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Search, Trophy } from "lucide-react";
import type { Match, MatchStatus } from "@/lib/types";

const statusLabels: Record<MatchStatus, string> = {
  scheduled: "In programma",
  live: "Live",
  finished: "Finita",
  postponed: "Rinviata"
};

const pageSize = 8;

export function MatchSchedule({ matches }: { matches: Match[] }) {
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

      <div className="schedule-groups">
        {groupedMatches.map(([girone, items]) => (
          <section className="schedule-group" key={girone}>
            <div className="schedule-group-header">
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
                      <span><MapPin size={14} /> {match.court}</span>
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
        ))}
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

function getGironeLabel(match: Match) {
  return match.category?.trim() || "Senza girone";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
