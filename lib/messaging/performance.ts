const marks = new Map<string, number>();

function enabled(): boolean {
  return process.env.NODE_ENV === "development" && typeof performance !== "undefined";
}

export function startMessagingMeasure(name: string): void {
  if (!enabled()) return;
  marks.set(name, performance.now());
}

export function endMessagingMeasure(
  name: string,
  details?: Record<string, unknown>,
): void {
  if (!enabled()) return;
  const startedAt = marks.get(name);
  if (startedAt === undefined) return;
  marks.delete(name);
  const durationMs = performance.now() - startedAt;
  // Development-only diagnostics; never sent to analytics.
  console.debug(`[messaging:performance] ${name}`, {
    durationMs: Math.round(durationMs * 10) / 10,
    ...details,
  });
}
