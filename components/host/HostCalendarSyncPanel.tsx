"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, Link2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NexaSelect } from "@/components/ui/NexaSelect";
import {
  connectExternalCalendar,
  deleteExternalCalendar,
  getCalendarExport,
  listExternalCalendars,
  regenerateCalendarExport,
  syncExternalCalendar,
  updateExternalCalendar,
  type ExternalCalendarDto,
  type ExternalCalendarProvider,
} from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import { showSaveToast } from "@/lib/save-toast";
import { cn } from "@/lib/utils";

const PROVIDERS: { id: ExternalCalendarProvider; label: string; hint: string }[] = [
  { id: "AIRBNB", label: "Airbnb", hint: "Paste your Airbnb export calendar URL" },
  { id: "BOOKING", label: "Booking.com", hint: "Paste your Booking.com calendar URL" },
  { id: "VRBO", label: "Vrbo", hint: "Paste your Vrbo calendar URL" },
  { id: "OTHER", label: "Other", hint: "Any platform that gives a calendar URL" },
];

function healthColor(health: string) {
  if (health === "Healthy") return "text-green-700 bg-green-50 border-green-200";
  if (health === "Paused") return "text-nexa-ink-3 bg-nexa-bg-2 border-nexa-line";
  if (health === "Error") return "text-amber-800 bg-amber-50 border-amber-200";
  return "text-nexa-ink-3 bg-nexa-bg-2 border-nexa-line";
}

function relativeTime(iso?: string | null) {
  if (!iso) return "Never";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const mins = Math.round((Date.now() - t) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} h ago`;
  return new Date(iso).toLocaleString();
}

type Props = {
  listings: Array<{ id: string; title: string }>;
  token: string;
  t: (key: string) => string;
};

export function HostCalendarSyncPanel({ listings, token, t }: Props) {
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [calendars, setCalendars] = useState<ExternalCalendarDto[]>([]);
  const [exportUrl, setExportUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [provider, setProvider] = useState<ExternalCalendarProvider>("AIRBNB");
  const [icsUrl, setIcsUrl] = useState("");
  const [label, setLabel] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncCooldownUntil, setSyncCooldownUntil] = useState(0);
  const [copied, setCopied] = useState(false);
  const [connectGuide, setConnectGuide] = useState<{
    nights: number;
    last?: { start: string; end: string } | null;
  } | null>(null);

  const refresh = useCallback(async () => {
    if (!listingId || !token) return;
    setLoading(true);
    setError(null);
    try {
      const [list, exp] = await Promise.all([
        listExternalCalendars(listingId, token),
        getCalendarExport(listingId, token),
      ]);
      setCalendars(list.calendars);
      setExportUrl(exp.url);
    } catch (e) {
      setError(formatUserError(e) || "Could not load calendar sync");
    } finally {
      setLoading(false);
    }
  }, [listingId, token]);

  useEffect(() => {
    if (!listingId && listings[0]?.id) setListingId(listings[0].id);
  }, [listings, listingId]);

  useEffect(() => {
    setConnectGuide(null);
    void refresh();
  }, [refresh]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingId || !icsUrl.trim()) return;
    setConnecting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await connectExternalCalendar(
        listingId,
        {
          provider,
          ics_url: icsUrl.trim(),
          label: label.trim() || undefined,
        },
        token,
      );
      setIcsUrl("");
      setLabel("");
      setConnectGuide({
        nights: res.sync.blocked_nights,
        last: res.sync.last_reservation,
      });
      setSuccess(
        `${PROVIDERS.find((p) => p.id === provider)?.label ?? "Calendar"} connected`,
      );
      showSaveToast();
      await refresh();
    } catch (err) {
      setError(formatUserError(err) || "Could not connect calendar");
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (calId: string) => {
    if (Date.now() < syncCooldownUntil) return;
    setError(null);
    try {
      const summary = await syncExternalCalendar(listingId, calId, token);
      setSyncCooldownUntil(Date.now() + 30_000);
      setSuccess(
        summary.outcome === "NOT_MODIFIED"
          ? "Already up to date"
          : `Synced — ${summary.blocked_nights} nights blocked`,
      );
      showSaveToast();
      await refresh();
    } catch (err) {
      setError(formatUserError(err) || "Sync failed");
    }
  };

  const handlePauseToggle = async (cal: ExternalCalendarDto) => {
    try {
      await updateExternalCalendar(
        listingId,
        cal.id,
        { status: cal.status === "PAUSED" ? "ACTIVE" : "PAUSED" },
        token,
      );
      showSaveToast();
      await refresh();
    } catch (err) {
      setError(formatUserError(err) || "Update failed");
    }
  };

  const handleDelete = async (calId: string) => {
    if (!confirm("Disconnect this calendar? Imported blocked nights from it will be removed. Nexa bookings stay.")) {
      return;
    }
    try {
      await deleteExternalCalendar(listingId, calId, token);
      setConnectGuide(null);
      showSaveToast();
      await refresh();
    } catch (err) {
      setError(formatUserError(err) || "Disconnect failed");
    }
  };

  const handleCopyExport = async () => {
    if (!exportUrl) return;
    await navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegen = async () => {
    if (!confirm("Regenerate export link? The old link will stop working.")) return;
    try {
      const exp = await regenerateCalendarExport(listingId, token);
      setExportUrl(exp.url);
      setSuccess("Export link regenerated");
      showSaveToast();
    } catch (err) {
      setError(formatUserError(err) || "Could not regenerate link");
    }
  };

  const syncDisabled = Date.now() < syncCooldownUntil;

  return (
    <div className="rounded-2xl border border-nexa-line bg-white overflow-hidden mb-8">
      <div className="p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-nexa-ink mb-2 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-nexa-primary" />
            {t("hostDashboard.calendarSyncTitle")}
          </h2>
          <p className="text-sm text-nexa-ink-3">
            {t("hostDashboard.calendarSyncDesc")}
          </p>
        </div>

        <label className="block text-sm max-w-md">
          <span className="text-nexa-ink-3 text-xs font-semibold uppercase tracking-wide">Listing</span>
          <NexaSelect
            variant="field"
            className="mt-1"
            value={listingId}
            onChange={setListingId}
            aria-label="Listing"
            options={listings.map((l) => ({ value: l.id, label: l.title }))}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}

        <form onSubmit={handleConnect} className="space-y-3 rounded-xl border border-nexa-line p-4 bg-nexa-bg/40">
          <p className="text-sm font-medium text-nexa-ink">Step 1 — Import a calendar</p>
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  provider === p.id
                    ? "border-nexa-primary bg-nexa-primary-soft text-nexa-primary"
                    : "border-nexa-line text-nexa-ink-3 hover:border-nexa-primary/40",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="url"
            required
            placeholder="https://…calendar.ics"
            value={icsUrl}
            onChange={(e) => setIcsUrl(e.target.value)}
            className="h-11 w-full rounded-xl border border-nexa-line px-3 text-sm"
          />
          <input
            type="text"
            placeholder="Nickname (optional) — e.g. My Airbnb villa"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-11 w-full rounded-xl border border-nexa-line px-3 text-sm"
          />
          <Button type="submit" disabled={connecting || !icsUrl.trim()}>
            {connecting ? "Connecting…" : "Import calendar"}
          </Button>
        </form>

        {connectGuide && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900 space-y-1">
            <p className="font-semibold">✓ Calendar connected</p>
            <p>{connectGuide.nights} blocked nights imported</p>
            {connectGuide.last && (
              <p>
                Last reservation: {connectGuide.last.start} – {connectGuide.last.end}
              </p>
            )}
            <p>Last synced: Just now</p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium text-nexa-ink">Sync health</p>
          {loading ? (
            <p className="text-sm text-nexa-ink-4">Loading…</p>
          ) : calendars.length === 0 ? (
            <p className="text-sm text-nexa-ink-4">No calendars connected yet.</p>
          ) : (
            calendars.map((cal) => (
              <div
                key={cal.id}
                className="rounded-xl border border-nexa-line p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-nexa-ink">
                      {cal.label || cal.provider}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full border",
                        healthColor(cal.health),
                      )}
                    >
                      {cal.health}
                    </span>
                  </div>
                  <p className="text-xs text-nexa-ink-4 truncate">{cal.provider}</p>
                  <p className="text-sm text-nexa-ink-3">
                    Last successful sync: {relativeTime(cal.last_successful_sync_at)}
                  </p>
                  {cal.status === "ERROR" && cal.last_attempt_at && (
                    <p className="text-sm text-amber-800">
                      Latest attempt: {relativeTime(cal.last_attempt_at)} (failed)
                      {cal.last_error ? ` — ${cal.last_error}` : ""}
                    </p>
                  )}
                  {cal.sync_result?.blocked_nights != null && (
                    <p className="text-sm text-nexa-ink-3">
                      Imported: {cal.sync_result.blocked_nights} nights blocked
                    </p>
                  )}
                  {cal.history && cal.history.length > 0 && (
                    <ul className="mt-2 text-xs text-nexa-ink-4 space-y-0.5">
                      {cal.history.slice(0, 5).map((h) => (
                        <li key={h.id}>
                          {new Date(h.started_at).toLocaleString()} — {h.outcome}
                          {h.message ? `: ${h.message}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={syncDisabled || cal.status === "PAUSED"}
                    onClick={() => handleSync(cal.id)}
                  >
                    <RefreshCw className="h-3.5 w-3.5 me-1" />
                    Sync now
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handlePauseToggle(cal)}
                  >
                    {cal.status === "PAUSED" ? "Resume" : "Pause"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => handleDelete(cal.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl border border-nexa-line p-4 space-y-3">
          <p className="text-sm font-medium text-nexa-ink">Step 2 — Export your Nexa calendar</p>
          <p className="text-sm text-nexa-ink-3">
            Copy this link and paste it into Airbnb / Booking / Vrbo under &quot;Import calendar&quot;
            so those platforms block nights when you get a Nexa booking.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={exportUrl}
              className="h-11 flex-1 rounded-xl border border-nexa-line px-3 text-sm bg-nexa-bg-2"
            />
            <Button type="button" variant="outline" onClick={handleCopyExport}>
              {copied ? <Check className="h-4 w-4 me-1" /> : <Copy className="h-4 w-4 me-1" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button type="button" variant="outline" onClick={handleRegen}>
              Regenerate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
