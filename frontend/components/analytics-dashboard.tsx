"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Globe2, MapPin, MonitorSmartphone, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import type { AnalyticsCount, AnalyticsSummary } from "@/lib/types";

const countryPositions: Record<string, { x: number; y: number }> = {
  IT: { x: 52, y: 44 },
  Italia: { x: 52, y: 44 },
  GR: { x: 56, y: 49 },
  Grecia: { x: 56, y: 49 },
  FR: { x: 47, y: 41 },
  Francia: { x: 47, y: 41 },
  DE: { x: 51, y: 36 },
  Germania: { x: 51, y: 36 },
  ES: { x: 43, y: 47 },
  Spagna: { x: 43, y: 47 },
  CH: { x: 50, y: 41 },
  Svizzera: { x: 50, y: 41 },
  AT: { x: 53, y: 40 },
  Austria: { x: 53, y: 40 },
  US: { x: 20, y: 42 },
  USA: { x: 20, y: 42 },
  "United States": { x: 20, y: 42 },
  GB: { x: 45, y: 34 },
  UK: { x: 45, y: 34 },
  "United Kingdom": { x: 45, y: 34 }
};

export function AnalyticsDashboard({ eventSlug }: { eventSlug: string }) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/analytics?eventSlug=${encodeURIComponent(eventSlug)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.message || "Statistiche non disponibili.");
        return;
      }

      setSummary(payload as AnalyticsSummary);
    } catch {
      setError("Statistiche non disponibili.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [eventSlug]);

  const mapPoints = useMemo(() => {
    if (!summary) return [];
    const maxCount = Math.max(...summary.countries.map((country) => country.count), 1);

    return summary.countries.map((country, index) => {
      const position = countryPositions[country.label] || fallbackPosition(index);
      return {
        ...country,
        x: position.x,
        y: position.y,
        size: 14 + Math.round((country.count / maxCount) * 22)
      };
    });
  }, [summary]);

  if (isLoading) {
    return (
      <div>
        <PanelTitle />
        <div className="analytics-empty"><RefreshCw size={18} /> Caricamento statistiche...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PanelTitle />
        <div className="analytics-empty error">{error}</div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div>
      <PanelTitle onRefresh={loadAnalytics} />

      <div className="analytics-stat-grid">
        <MetricCard label="Visite totali" value={summary.totalVisits} icon={<BarChart3 size={19} />} />
        <MetricCard label="Oggi" value={summary.visitsToday} icon={<RefreshCw size={19} />} />
        <MetricCard label="Ultimi 7 giorni" value={summary.visitsLast7Days} icon={<Globe2 size={19} />} />
        <MetricCard label="Paesi" value={summary.countries.length} icon={<MapPin size={19} />} />
      </div>

      <div className="analytics-grid">
        <section className="analytics-card analytics-map-card">
          <div className="section-title-row">
            <div>
              <span className="small-label">Mappa visitatori</span>
              <h3>Da dove arrivano</h3>
            </div>
          </div>
          <div className="analytics-map" aria-label="Mappa visitatori per paese">
            <div className="analytics-map-grid" />
            {mapPoints.map((point) => (
              <span
                className="analytics-map-point"
                style={{ left: `${point.x}%`, top: `${point.y}%`, width: point.size, height: point.size }}
                title={`${point.label}: ${point.count} visite`}
                key={point.label}
              />
            ))}
          </div>
          <CountList items={summary.countries} emptyLabel="Nessuna posizione ancora rilevata." />
        </section>

        <section className="analytics-card">
          <div className="section-title-row">
            <div>
              <span className="small-label">Pagine</span>
              <h3>Contenuti piu visti</h3>
            </div>
          </div>
          <CountList items={summary.paths} emptyLabel="Nessuna pagina visitata." />
        </section>

        <section className="analytics-card">
          <div className="section-title-row">
            <div>
              <span className="small-label">Dispositivi</span>
              <h3><MonitorSmartphone size={18} /> Device</h3>
            </div>
          </div>
          <CountList items={summary.devices} emptyLabel="Nessun device rilevato." />
        </section>

        <section className="analytics-card">
          <div className="section-title-row">
            <div>
              <span className="small-label">Citta / zone</span>
              <h3>Localita principali</h3>
            </div>
          </div>
          <CountList items={summary.cities.length ? summary.cities : summary.regions} emptyLabel="Nessuna localita ancora rilevata." />
        </section>
      </div>

      <section className="analytics-card">
        <div className="section-title-row">
          <div>
            <span className="small-label">Ultimi accessi</span>
            <h3>Visite recenti</h3>
          </div>
        </div>
        {summary.recent.length === 0 ? <div className="empty">Nessuna visita registrata.</div> : null}
        <div className="recent-visit-list">
          {summary.recent.map((visit) => (
            <div className="recent-visit-row" key={visit.id}>
              <strong>{visit.path}</strong>
              <span>{[visit.city, visit.region, visit.country].filter(Boolean).join(", ") || "Sconosciuto"}</span>
              <span>{visit.device}</span>
              <time>{formatDate(visit.createdAt)}</time>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PanelTitle({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div className="panel-header">
      <div>
        <h2>Statistiche</h2>
        <p className="muted">Visite anonime, provenienza e pagine piu consultate. Non vengono salvati indirizzi IP.</p>
      </div>
      {onRefresh ? <button className="ghost-button" type="button" onClick={onRefresh}><RefreshCw size={17} /> Aggiorna</button> : null}
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="analytics-metric">
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

function CountList({ items, emptyLabel }: { items: AnalyticsCount[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <div className="empty">{emptyLabel}</div>;
  }

  return (
    <div className="analytics-count-list">
      {items.map((item) => (
        <div className="analytics-count-row" key={item.label}>
          <div>
            <strong>{item.label}</strong>
            <span>{item.count} visite</span>
          </div>
          <div className="analytics-bar">
            <span style={{ width: `${Math.max(item.percent, 4)}%` }} />
          </div>
          <em>{item.percent}%</em>
        </div>
      ))}
    </div>
  );
}

function fallbackPosition(index: number) {
  return {
    x: 24 + ((index * 17) % 54),
    y: 28 + ((index * 13) % 42)
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
