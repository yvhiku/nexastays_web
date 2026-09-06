"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export const textareaClassName =
  "flex min-h-[120px] w-full rounded-xl border-2 border-nexa-line bg-white px-4 py-3 text-base font-sans text-nexa-ink outline-none transition-colors duration-150 placeholder:text-nexa-ink-4 focus:border-nexa-primary focus:ring-2 focus:ring-nexa-primary/20 sm:text-sm";

/** Red border is reserved for invalid controls — never reused for selection/cover. */
export const invalidControlClassName =
  "border-red-500 focus:border-red-500 focus:ring-red-500/20";

/**
 * Step heading. The h2 is focusable so the shell can move focus here on step
 * change (screen readers announce the new step; keyboard users land in place).
 */
export const StepHeader = React.forwardRef<
  HTMLHeadingElement,
  {
    eyebrow: string;
    title: string;
    description?: string;
    tip?: string;
    /** Small "Optional" style badge next to the eyebrow. */
    badge?: string;
  }
>(function StepHeader({ eyebrow, title, description, tip, badge }, ref) {
  return (
    <div className="mb-8">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-nexa-primary">
        <span>{eyebrow}</span>
        {badge && (
          <span className="rounded-md bg-nexa-bg-2 px-1.5 py-0.5 text-[0.65rem] font-semibold normal-case tracking-normal text-nexa-ink-3">
            {badge}
          </span>
        )}
      </p>
      <h2
        ref={ref}
        tabIndex={-1}
        className="mt-2 font-sans text-2xl font-semibold tracking-tight text-nexa-ink outline-none sm:text-[1.75rem]"
      >
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
});

/**
 * Labelled form field. When `error` is set the child control receives
 * `aria-invalid` + `aria-describedby` (cloned in) and the wrapper gets the
 * data attribute the error summary uses to jump/focus.
 */
export function Field({
  id,
  label,
  children,
  hint,
  required,
  error,
  counter,
}: {
  /** Stable field id (matches keys from `validateStepFields`). */
  id?: string;
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  error?: string | null;
  /** Right-aligned helper such as `120 / 200`. */
  counter?: string;
}) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  const controlId = `${fieldId}-control`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const child = React.Children.only(children);
  const control = React.isValidElement(child)
    ? React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        id: (child.props as Record<string, unknown>).id ?? controlId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        className: cn(
          (child.props as Record<string, unknown>).className as string | undefined,
          error && invalidControlClassName,
        ),
      })
    : children;

  return (
    <div className="space-y-2" data-wizard-field={fieldId}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={controlId} className="block text-sm font-semibold text-nexa-ink">
          {label}
          {required && (
            <span className="ms-0.5 text-nexa-primary" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {counter && (
          <span className="text-xs tabular-nums text-nexa-ink-4" aria-hidden="true">
            {counter}
          </span>
        )}
      </div>
      {control}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium leading-relaxed text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-xs leading-relaxed text-nexa-ink-4">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** Input with a trailing unit adornment (e.g. MAD). */
export const AdornedInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { adornment: string }
>(function AdornedInput({ adornment, className, ...props }, ref) {
  return (
    <div className="relative">
      <Input ref={ref} className={cn("pe-16", className)} {...props} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-sm font-semibold text-nexa-ink-4"
      >
        {adornment}
      </span>
    </div>
  );
});

export function SectionCard({
  title,
  description,
  children,
  action,
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl border-2 border-nexa-line bg-white p-5 shadow-nexa-sm sm:p-6"
    >
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

/**
 * Large tappable option. Selection uses soft fill (not a competing border
 * color); `busy` shows an in-card spinner while a draft is being created.
 */
export function ChoiceCard({
  selected,
  onClick,
  title,
  support,
  icon,
  busy,
  disabled,
  selectedLabel,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  support: string;
  icon?: React.ReactNode;
  busy?: boolean;
  disabled?: boolean;
  selectedLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-pressed={selected}
      aria-busy={busy || undefined}
      className={cn(
        "relative rounded-[22px] border-2 p-5 text-start transition-[background-color,border-color,box-shadow,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/30 focus-visible:ring-offset-2",
        selected
          ? "border-nexa-primary bg-nexa-primary-soft shadow-nexa-sm"
          : "border-nexa-line bg-white hover:border-nexa-primary/50 hover:shadow-nexa-sm",
        disabled && !busy && "opacity-50",
      )}
    >
      {busy && (
        <span className="absolute end-4 top-4 text-nexa-primary">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        </span>
      )}
      {icon}
      <div className="flex items-start justify-between gap-2">
        <h3 className="mt-3 font-sans text-base font-semibold text-nexa-ink">{title}</h3>
        {selected && selectedLabel && (
          <span className="mt-3 shrink-0 rounded-md bg-nexa-primary px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
            {selectedLabel}
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
      aria-pressed={selected}
      className={cn(
        "min-h-[44px] rounded-xl border-2 px-3 py-3 text-start text-sm font-medium transition-[background-color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/30",
        selected
          ? "border-nexa-primary bg-nexa-primary-soft text-nexa-ink"
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
        "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border-2 px-3 py-3 transition-colors duration-150",
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

/**
 * Empty-state block that always invites an action (never blank whitespace).
 */
export function EmptyInvite({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-nexa-line bg-nexa-bg px-5 py-8 text-center">
      {icon && <div className="text-nexa-primary">{icon}</div>}
      <p className="font-sans text-base font-semibold text-nexa-ink">{title}</p>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-nexa-ink-3">{description}</p>
      )}
      {action}
    </div>
  );
}
