"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  LifeBuoy,
  MapPin,
  Star,
  Users,
  X,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationDetail } from "@/lib/messaging/messages-api";
import {
  deriveContextModules,
  type ContextModule,
  type ContextModuleId,
} from "@/lib/messaging/context-panel";
import { executeCardAction } from "@/lib/messaging/actions/registry";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  MESSAGING_EASE_OUT,
  MESSAGING_MOTION,
} from "@/lib/messaging/motion";

type Props = {
  conversation: ConversationDetail;
  activity?: {
    messages: number;
    photos: number;
    files: number;
    voice: number;
  };
  contextualNote?: string | null;
  className?: string;
  onClose?: () => void;
};

const ICONS: Record<ContextModuleId, React.ComponentType<{ className?: string }>> = {
  booking: Home,
  checkin: MapPin,
  access: KeyRound,
  payment: CreditCard,
  review: Star,
  dispute: AlertTriangle,
  support: LifeBuoy,
};

function formatDate(value: unknown, locale: string): string {
  if (typeof value !== "string" || !value) return "";
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function actionLabel(action: ContextModule["actions"][number], t: (key: string) => string) {
  if (action.id.includes("view_booking")) return t("inbox.context.viewBooking");
  if (action.id.includes("leave_review")) return t("inbox.context.leaveReview");
  if (action.id.includes("support")) return t("inbox.context.contactSupport");
  return action.label;
}

function ModuleActions({ module }: { module: ContextModule }) {
  const { t, localePath } = useLanguage();
  if (module.actions.length === 0) return null;
  return (
    <div className="mt-8 flex flex-col gap-3">
      {module.actions.slice(0, 2).map((action, index) => (
        <button
          key={action.id}
          type="button"
          onClick={() => executeCardAction(action, { localePath })}
          className={cn(
            "group flex min-h-12 w-full items-center justify-between rounded-messaging-dropdown border px-4 text-start text-sm font-semibold shadow-messaging-1 transition-[background-color,border-color,box-shadow,transform] duration-messaging-hover motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 active:scale-[0.98] active:duration-messaging-press lg:min-h-10",
            index === 0
              ? "border-nexa-primary/20 bg-[linear-gradient(145deg,#e8507a,#f06792)] text-white hover:-translate-y-px hover:shadow-messaging-2"
              : "border-nexa-line bg-white text-nexa-ink-2 hover:-translate-y-px hover:bg-nexa-bg-2 hover:text-nexa-ink hover:shadow-messaging-2",
          )}
        >
          {actionLabel(action, t)}
          <ArrowUpRight className={cn("h-5 w-5 stroke-[1.75] transition-transform duration-messaging-hover group-hover:-translate-y-px group-hover:translate-x-px rtl:-scale-x-100", index === 0 ? "text-white/85" : "text-nexa-ink-3")} />
        </button>
      ))}
    </div>
  );
}

// Kept for the richer booking renderer while the registry uses the compact variant.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BookingModule({
  module,
  status,
}: {
  module: ContextModule;
  status?: string | null;
}) {
  const { t, locale } = useLanguage();
  const snapshot = module.snapshot ?? {};
  const coverUrl =
    typeof snapshot.coverUrl === "string" ? snapshot.coverUrl : null;
  const location = [
    snapshot.addressDisplay,
    snapshot.city,
    snapshot.country,
  ]
    .filter((value) => typeof value === "string" && value)
    .join(", ");

  return (
    <>
      {coverUrl ? (
        <div className="mb-6 overflow-hidden rounded-messaging-panel border border-nexa-line bg-nexa-bg-2 shadow-messaging-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt=""
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : null}
      <h3 className="font-display text-xl font-semibold leading-tight text-nexa-ink">
        {module.title}
      </h3>
      <dl className="mt-6 space-y-5 rounded-messaging-card border border-nexa-line bg-nexa-bg p-5 text-sm shadow-messaging-1">
        <div className="flex items-start justify-between gap-3">
          <dt className="font-display text-lg font-semibold text-nexa-ink">
            {t("inbox.context.bookingOverview")}
          </dt>
          {status ? (
            <dd className="inline-flex shrink-0 rounded-full border border-nexa-primary/15 bg-nexa-primary-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-nexa-primary">
              {status}
            </dd>
          ) : null}
        </div>
        <div className="flex gap-3.5">
          <CalendarDays className="box-content h-5 w-5 shrink-0 rounded-xl border border-nexa-line bg-white p-2 stroke-[1.75] text-nexa-ink-3 shadow-messaging-1" />
          <div>
            <dt className="font-semibold text-nexa-ink">{t("inbox.duration")}</dt>
            <dd className="mt-1 leading-6 text-nexa-ink-2">
              {formatDate(snapshot.checkinDate, locale)} –{" "}
              {formatDate(snapshot.checkoutDate, locale)}
            </dd>
          </div>
        </div>
        {Number(snapshot.guestCount) > 0 ? (
          <div className="flex gap-3.5">
            <Users className="box-content h-5 w-5 shrink-0 rounded-xl border border-nexa-line bg-white p-2 stroke-[1.75] text-nexa-ink-3 shadow-messaging-1" />
            <div>
              <dt className="font-semibold text-nexa-ink">{t("inbox.guests")}</dt>
              <dd className="mt-1 text-nexa-ink-2">
                {String(snapshot.guestCount)}
              </dd>
            </div>
          </div>
        ) : null}
        {location ? (
          <div className="flex gap-3.5">
            <MapPin className="box-content h-5 w-5 shrink-0 rounded-xl border border-nexa-line bg-white p-2 stroke-[1.75] text-nexa-ink-3 shadow-messaging-1" />
            <div>
              <dt className="font-semibold text-nexa-ink">{t("inbox.location")}</dt>
              <dd className="mt-1 leading-6 text-nexa-ink-2">{location}</dd>
            </div>
          </div>
        ) : null}
      </dl>
      <ModuleActions module={module} />
    </>
  );
}

function AccessModule({ module }: { module: ContextModule }) {
  const { t } = useLanguage();
  const credential = String(module.snapshot?.credential ?? "");
  const [revealed, setRevealed] = useState(false);
  return (
    <>
      <div className="flex h-12 w-12 items-center justify-center rounded-messaging-dropdown border border-nexa-line bg-nexa-bg-2 text-nexa-ink-3 shadow-messaging-1">
        <KeyRound className="h-6 w-6 stroke-[1.75]" />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold text-nexa-ink">
        {t("inbox.context.accessTitle")}
      </h3>
      {module.body ? (
        <p className="mt-2.5 text-sm leading-6 text-nexa-ink-2">{module.body}</p>
      ) : null}
      <div className="mt-6 rounded-messaging-card border border-nexa-line bg-nexa-bg p-5 shadow-messaging-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-nexa-ink-4">
          {t("inbox.context.accessCode")}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate text-xl font-semibold tracking-[0.18em] text-nexa-ink">
            {revealed ? credential : "••••••"}
          </code>
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-transparent text-nexa-ink-3 transition-[background-color,border-color,color,transform] duration-messaging-hover hover:border-nexa-line hover:bg-white hover:text-nexa-ink active:scale-95 active:duration-messaging-press motion-reduce:transition-none lg:h-10 lg:w-10"
            aria-label={
              revealed
                ? t("inbox.context.hideAccessCode")
                : t("inbox.context.showAccessCode")
            }
          >
            {revealed ? <EyeOff className="h-5 w-5 stroke-[1.75]" /> : <Eye className="h-5 w-5 stroke-[1.75]" />}
          </button>
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(credential)}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-transparent text-nexa-ink-3 transition-[background-color,border-color,color,transform] duration-messaging-hover hover:border-nexa-line hover:bg-white hover:text-nexa-ink active:scale-95 active:duration-messaging-press motion-reduce:transition-none lg:h-10 lg:w-10"
            aria-label={t("inbox.context.copyAccessCode")}
          >
            <Copy className="h-5 w-5 stroke-[1.75]" />
          </button>
        </div>
      </div>
    </>
  );
}

function GenericModule({ module }: { module: ContextModule }) {
  const { t } = useLanguage();
  const Icon = ICONS[module.id];
  return (
    <>
      <div className="flex h-12 w-12 items-center justify-center rounded-messaging-dropdown border border-nexa-line bg-nexa-bg-2 text-nexa-ink-3 shadow-messaging-1">
        <Icon className="h-6 w-6 stroke-[1.75]" />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold leading-tight text-nexa-ink">
        {module.title || t(`${module.labelKey}Title`)}
      </h3>
      {module.body ? (
        <p className="mt-2.5 text-sm leading-6 text-nexa-ink-2">{module.body}</p>
      ) : null}
      <ModuleActions module={module} />
    </>
  );
}

export type ContextModuleRendererProps = {
  module: ContextModule;
  conversation: ConversationDetail;
};

type ModuleRenderer = React.ComponentType<ContextModuleRendererProps>;

export const contextModuleRegistry = new Map<ContextModuleId, ModuleRenderer>();

export function registerContextModuleRenderer(
  id: ContextModuleId,
  renderer: ModuleRenderer,
) {
  contextModuleRegistry.set(id, renderer);
}

registerContextModuleRenderer("booking", function RegisteredBookingModule({
  module,
}) {
  return <GenericModule module={{ ...module, actions: [] }} />;
});

registerContextModuleRenderer("access", function RegisteredAccessModule({ module }) {
  return <AccessModule module={module} />;
});

export function MessagingContextPanel({
  conversation,
  activity,
  contextualNote,
  className,
  onClose,
}: Props) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const state = useMemo(
    () => deriveContextModules(conversation),
    [conversation],
  );
  const [selectedId, setSelectedId] = useState<ContextModuleId>(
    () => {
      if (typeof window === "undefined") return state.recommendedId;
      try {
        return (
          localStorage.getItem(
            `nexa-messaging-context-module:${conversation.conversation.id}`,
          ) as ContextModuleId | null
        ) ?? state.recommendedId;
      } catch {
        return state.recommendedId;
      }
    },
  );
  const conversationIdRef = React.useRef(conversation.conversation.id);

  useEffect(() => {
    setSelectedId((current) => {
      if (conversationIdRef.current !== conversation.conversation.id) {
        conversationIdRef.current = conversation.conversation.id;
        return state.recommendedId;
      }
      return state.modules.some((module) => module.id === current)
        ? current
        : state.recommendedId;
    });
  }, [conversation.conversation.id, state.modules, state.recommendedId]);

  const selected =
    state.modules.find((module) => module.id === selectedId) ??
    state.modules[0];
  useEffect(() => {
    if (!selected) return;
    try {
      localStorage.setItem(
        `nexa-messaging-context-module:${conversation.conversation.id}`,
        selected.id,
      );
    } catch {
      /* storage may be unavailable */
    }
  }, [conversation.conversation.id, selected]);
  const SelectedModule = selected
    ? contextModuleRegistry.get(selected.id)
    : undefined;

  const navigateTabs = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const rtl = document.documentElement.dir === "rtl";
    const last = state.modules.length - 1;
    let next = index;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else {
      const movement =
        event.key === "ArrowRight" ? (rtl ? -1 : 1) : (rtl ? 1 : -1);
      next = (index + movement + state.modules.length) % state.modules.length;
    }
    const selectedModule = state.modules[next];
    if (!selectedModule) return;
    setSelectedId(selectedModule.id);
    requestAnimationFrame(() =>
      document.getElementById(`context-tab-${selectedModule.id}`)?.focus(),
    );
  };

  return (
    <aside
      aria-label={t("inbox.context.title")}
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden border-s border-nexa-line bg-[linear-gradient(180deg,#fff_0%,#fdfbfc_42%,#fff_100%)] shadow-messaging-2",
        className,
      )}
    >
      <div className="flex shrink-0 items-start justify-between px-4 pb-5 pt-6 sm:px-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-nexa-ink-3">
            {t("inbox.context.eyebrow")}
          </p>
          <h2 className="mt-1 font-display text-[22px] font-semibold leading-tight text-nexa-ink">
            {t("inbox.context.title")}
          </h2>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="-me-2 -mt-2 flex h-12 w-12 items-center justify-center rounded-full border border-transparent text-nexa-ink-3 transition-[background-color,border-color,color,transform] duration-messaging-hover hover:border-nexa-line hover:bg-nexa-bg-2 hover:text-nexa-ink active:scale-95 active:duration-messaging-press motion-reduce:transition-none lg:h-10 lg:w-10"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5 stroke-[1.75]" />
          </button>
        ) : null}
      </div>

      <div
        className="flex shrink-0 flex-wrap gap-2 overflow-x-hidden border-b border-nexa-line px-4 pb-3 sm:px-6"
        role="tablist"
        aria-label={t("inbox.context.title")}
      >
        {state.modules.map((module, index) => {
          const Icon = ICONS[module.id];
          const active = selected?.id === module.id;
          return (
            <button
              key={module.id}
              type="button"
              role="tab"
              id={`context-tab-${module.id}`}
              aria-controls={`context-panel-${module.id}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => setSelectedId(module.id)}
              onKeyDown={(event) => navigateTabs(event, index)}
              className={cn(
                "inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-messaging-hover motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 active:scale-95 active:duration-messaging-press lg:min-h-10",
                active
                  ? "border-nexa-primary/20 bg-[linear-gradient(145deg,#e8507a,#f06792)] text-white shadow-messaging-1"
                  : "border-nexa-line bg-white text-nexa-ink-3 hover:bg-nexa-bg-2 hover:text-nexa-ink hover:shadow-messaging-1",
              )}
            >
              <Icon className="h-4 w-4 stroke-[1.75]" />
              {t(module.labelKey)}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {selected ? (
          <motion.div
            key={selected.id}
            id={`context-panel-${selected.id}`}
            role="tabpanel"
            aria-labelledby={`context-tab-${selected.id}`}
            tabIndex={0}
            initial={{ opacity: 0, x: reduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reduceMotion ? 0 : -6 }}
            transition={{
              duration: reduceMotion ? 0 : MESSAGING_MOTION.context,
              ease: MESSAGING_EASE_OUT,
            }}
            className="m-3 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden rounded-messaging-panel border border-nexa-line bg-white/95 p-5 pb-7 shadow-messaging-2 backdrop-blur-xl"
          >
            {SelectedModule ? (
              <>
                <SelectedModule module={selected} conversation={conversation} />
                {activity ? (
                  <section className="mt-7 border-t border-nexa-line/70 pt-5" aria-labelledby="context-activity-title">
                    <h3 id="context-activity-title" className="font-display text-base font-semibold text-nexa-ink">
                      {t("inbox.phase9.activity")}
                    </h3>
                    <dl className="mt-3 grid grid-cols-2 gap-2">
                      {([
                        ["messages", activity.messages],
                        ["photos", activity.photos],
                        ["files", activity.files],
                        ["voice", activity.voice],
                      ] as const).map(([key, value]) => (
                        <div key={key} className="rounded-xl bg-nexa-bg px-3 py-2.5">
                          <dt className="text-[11px] font-medium text-nexa-ink-3">{t(`inbox.phase9.${key}`)}</dt>
                          <dd className="mt-0.5 text-sm font-bold text-nexa-ink">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ) : null}
                {contextualNote ? (
                  <p className="mt-4 rounded-xl border border-nexa-primary/10 bg-nexa-primary-soft/55 px-3 py-2.5 text-xs leading-5 text-nexa-ink-2">
                    {contextualNote}
                  </p>
                ) : null}
              </>
            ) : (
              <GenericModule module={selected} />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </aside>
  );
}
