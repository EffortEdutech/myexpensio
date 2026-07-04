export function nowIso() {
  return new Date().toISOString();
}

/**
 * Formats an ISO timestamp as a short relative label ("Just now", "5m ago",
 * "3h ago", "2d ago"). Used for the sync staleness indicator so a PRO/PREMIUM
 * user can tell at a glance whether their data is current, without needing to
 * parse a raw timestamp. Falls back to "Never synced" for null input, and to
 * the raw date for anything older than 7 days (relative labels stop being
 * useful past that point).
 */
export function formatRelativeTime(isoTimestamp: string | null): string {
  if (!isoTimestamp) {
    return "Never synced";
  }

  const then = new Date(isoTimestamp).getTime();
  if (Number.isNaN(then)) {
    return "Never synced";
  }

  const diffMs = Date.now() - then;
  if (diffMs < 0) {
    return "Just now";
  }

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 30) {
    return "Just now";
  }
  if (diffSec < 60) {
    return `${diffSec}s ago`;
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}h ago`;
  }

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) {
    return `${diffDay}d ago`;
  }

  return new Date(isoTimestamp).toLocaleDateString();
}

