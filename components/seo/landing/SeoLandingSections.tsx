import React from "react";
import type { SeoLandingKeyValue, SeoLandingSeasonalNote } from "@/lib/seo/types";

export function SeoLandingKeyValueSection({ title, items }: { title: string; items: SeoLandingKeyValue[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-nexa-ink mb-4">{title}</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-[18px] border border-nexa-border/80 p-5 sm:p-6">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-nexa-muted">{item.label}</dt>
            <dd className="text-sm font-medium text-nexa-ink mt-0.5">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function SeoLandingSeasonal({ title, notes }: { title: string; notes: SeoLandingSeasonalNote[] }) {
  if (notes.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-nexa-ink mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {notes.map((note) => (
          <div key={note.season} className="rounded-[16px] border border-nexa-border/80 p-4 bg-nexa-surface/30">
            <p className="font-semibold text-nexa-ink">{note.season}</p>
            {note.temp_range && <p className="text-sm text-nexa-primary mt-0.5">{note.temp_range}</p>}
            <p className="text-sm text-nexa-muted mt-1">{note.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SeoLandingHighlights({
  title,
  items,
}: {
  title: string;
  items: { icon?: string; label: string; description?: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-nexa-ink mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-[16px] border border-nexa-border/80 p-4">
            {item.icon && <span className="text-xl" aria-hidden>{item.icon}</span>}
            <p className="font-semibold text-nexa-ink mt-1">{item.label}</p>
            {item.description && <p className="text-sm text-nexa-muted mt-1">{item.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SeoLandingWhyStay({ title, body }: { title: string; body: string }) {
  if (!body.trim()) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-nexa-ink mb-3">{title}</h2>
      <p className="text-nexa-ink/90 leading-relaxed max-w-3xl">{body}</p>
    </section>
  );
}

export function SeoLandingTravelersLove({ title, tips }: { title: string; tips: string[] }) {
  if (tips.length === 0) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-nexa-ink mb-4">{title}</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {tips.map((tip) => (
          <li key={tip} className="flex items-start gap-2 text-sm text-nexa-ink">
            <span className="text-nexa-primary font-bold" aria-hidden>
              ✓
            </span>
            {tip}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SeoLandingAudience({
  title,
  idealFor,
  pros,
  cons,
  avoidIf,
  labels,
}: {
  title: string;
  idealFor?: string[];
  pros?: string[];
  cons?: string[];
  avoidIf?: string[];
  labels: { idealFor: string; pros: string; cons: string; avoidIf: string };
}) {
  if (!idealFor?.length && !pros?.length && !cons?.length && !avoidIf?.length) return null;
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-nexa-ink mb-4">{title}</h2>
      {idealFor && idealFor.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wide text-nexa-muted mb-2">{labels.idealFor}</p>
          <div className="flex flex-wrap gap-2">
            {idealFor.map((tag) => (
              <span key={tag} className="rounded-full bg-nexa-primary/10 text-nexa-primary px-3 py-1 text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pros && pros.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-nexa-ink mb-2">{labels.pros}</p>
            <ul className="space-y-1 text-sm text-nexa-muted">
              {pros.map((p) => (
                <li key={p}>+ {p}</li>
              ))}
            </ul>
          </div>
        )}
        {cons && cons.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-nexa-ink mb-2">{labels.cons}</p>
            <ul className="space-y-1 text-sm text-nexa-muted">
              {cons.map((c) => (
                <li key={c}>− {c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {avoidIf && avoidIf.length > 0 && (
        <div className="mt-4 rounded-[12px] border border-amber-200/80 bg-amber-50/50 p-4">
          <p className="text-sm font-semibold text-nexa-ink mb-1">{labels.avoidIf}</p>
          <ul className="text-sm text-nexa-muted space-y-1">
            {avoidIf.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
