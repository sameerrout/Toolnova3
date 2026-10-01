'use client';

export type ToolEventType = 'tool_opened' | 'tool_started' | 'tool_completed' | 'tool_failed';

/**
 * Returns or initializes a persistent, anonymous visitor ID in browser localStorage.
 * Does not store any PII, passwords, or personal details.
 */
export function getAnonymousVisitorId(): string {
  if (typeof window === 'undefined') return 'server_side';

  try {
    let id = localStorage.getItem('toolino_anon_id') || localStorage.getItem('toolnova_anon_id');
    if (!id || id.length < 10) {
      id = 'anon_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
    localStorage.setItem('toolino_anon_id', id);
    return id;
  } catch {
    return 'fallback_visitor';
  }
}

/**
 * Returns or initializes a temporary session ID in browser sessionStorage.
 * Automatically rotates when the user closes their browser tab.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server_side';

  try {
    let id = sessionStorage.getItem('toolino_session_id') || sessionStorage.getItem('toolnova_session_id');
    if (!id || id.length < 10) {
      id = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
    sessionStorage.setItem('toolino_session_id', id);
    return id;
  } catch {
    return 'fallback_session';
  }
}

/**
 * Sends a privacy-safe pageview event to the analytics ingestion API.
 */
export async function trackPageView(path?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const currentPath = path || window.location.pathname;

    // Exclude internal API requests and manager routes from public visitor stats
    if (currentPath.startsWith('/api') || currentPath.startsWith('/manager')) {
      return;
    }

    const payload = {
      type: 'pageview',
      path: currentPath,
      anonymousId: getAnonymousVisitorId(),
      sessionId: getSessionId(),
      timestamp: Date.now(),
    };

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Fail silently to never impact user experience
  }
}

/**
 * Sends a privacy-safe tool usage event.
 * STRICT PRIVACY RULE: Never accepts or transmits file data, image contents, or text contents.
 */
export async function trackToolEvent(
  toolSlug: string,
  eventType: ToolEventType = 'tool_completed'
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const payload = {
      type: 'toolevent',
      toolSlug: toolSlug.trim().toLowerCase(),
      eventType,
      anonymousId: getAnonymousVisitorId(),
      sessionId: getSessionId(),
      timestamp: Date.now(),
    };

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Fail silently
  }
}
