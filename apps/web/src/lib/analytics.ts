const SESSION_KEY = "baseer_analytics_sid";

function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `anon_${Date.now()}`;
  }
}

export function trackPageView(path: string, caseStudySlug?: string | null) {
  if (typeof window === "undefined") return;
  if (path.startsWith("/admin")) return;

  const payload = {
    path,
    referrer: document.referrer || null,
    sessionId: getSessionId(),
    eventType: caseStudySlug ? ("case_study_view" as const) : ("page_view" as const),
    caseStudySlug: caseStudySlug ?? null,
  };

  const body = JSON.stringify(payload);
  const url = "/api/analytics/beacon";

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
  } catch {
    // fall through
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* ignore beacon failures */
  });
}
