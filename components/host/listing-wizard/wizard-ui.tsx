"use client";

import { cn } from "@/lib/utils";

export const textareaClassName =
  "flex min-h-[120px] w-full rounded-xl border-2 border-nexa-line bg-white px-4 py-3 text-base font-sans text-nexa-ink outline-none transition-colors placeholder:text-nexa-ink-4 focus:border-nexa-primary focus:ring-2 focus:ring-nexa-primary/20 sm:text-sm";

export function StepHeader({
  eyebrow,
  title,
  description,
  tip,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  tip?: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-nexa-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-sans text-2xl font-semibold tracking-tight text-nexa-ink sm:text-[1.75rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-nexa-ink-3">
          {description}
        </p>
      )}
      {tip && (
        <div className="mt-4 rounded-xl border border-nexa-primary/15 bg-nexa-primary-soft px-4 py-3 text-sm leading-relaxed text-nexa-ink-2">
          {tip}
        </div>
      )}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-nexa-ink">
        {label}
        {required && <span className="ml-0.5 text-nexa-primary">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-nexa-ink-4">{hint}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border-2 border-nexa-line bg-white p-5 shadow-nexa-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-sans text-base font-semibold text-nexa-ink">{title}</h3>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-nexa-ink-3">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function ChoiceCard({
  selected,
  onClick,
  title,
  support,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  support: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[22px] border-2 p-5 text-left transition-all",
        selected
          ? "border-nexa-primary bg-nexa-primary-soft shadow-nexa-sm"
          : "border-nexa-line bg-white hover:border-nexa-primary/50 hover:shadow-nexa-sm",
      )}
    >
      {icon}
      <div className="flex items-start justify-between gap-2">
        <h3 className="mt-3 font-sans text-base font-semibold text-nexa-ink">{title}</h3>
        {selected && (
          <span className="mt-3 shrink-0 rounded-full bg-nexa-primary px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
            Selected
          </span>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-nexa-ink-3">{support}</p>
    </button>
  );
}

export function ToggleChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 px-3 py-3 text-left text-sm font-medium transition-all",
        selected
          ? "border-nexa-primary bg-nexa-primary-soft text-nexa-ink shadow-nexa-sm"
          : "border-nexa-line bg-white text-nexa-ink-2 hover:border-nexa-primary/40",
      )}
    >
      {children}
    </button>
  );
}

export function CheckRow({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-3 transition-colors",
        checked
          ? "border-nexa-primary/40 bg-nexa-primary-soft"
          : "border-nexa-line bg-white hover:border-nexa-primary/30",
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-nexa-primary"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium text-nexa-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-nexa-ink-4">{hint}</span>}
      </span>
    </label>
  );
}

export function SoftTip({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-nexa-bg-2 px-4 py-3 text-sm leading-relaxed text-nexa-ink-3">
      {children}
    </p>
  );
}
