"use client";

import { useEffect } from "react";

export function AnalyticsTracker({ eventSlug, sectionSlug }: { eventSlug: string; sectionSlug?: string }) {
  useEffect(() => {
    const path = window.location.pathname;
    const sessionKey = `pgs-visit:${eventSlug}:${sectionSlug || "main"}:${path}`;

    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");

    const payload = JSON.stringify({
      eventSlug,
      sectionSlug: sectionSlug || "",
      path,
      referrer: document.referrer
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/visit", new Blob([payload], { type: "application/json" }));
      return;
    }

    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true
    }).catch(() => undefined);
  }, [eventSlug, sectionSlug]);

  return null;
}
