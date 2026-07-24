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

type Props = {
  conversation: ConversationDetail;
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
    <div className="mt-7 flex flex-col gap-2.5">
      {module.actions.slice(0, 2).map((action, index) => (
        <button
          key={action.id}
          type="button"
          onClick={() => executeCardAction(action, { localePath })}
          className={cn(
            "group flex min-h-12 w-full items-center justify-between rounded-2xl border px-4 text-start text-sm font-semibold transition-[background-color,border-color,box-shadow,transform] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 active:scale-[0.985]",
            index === 0
              ? "border-nexa-primary/20 bg-[linear-gradient(135deg,#f4809a,#e8507a_55%,#c93a62)] text-white shadow-[0_8px_20px_rgba(232,80,122,0.25)] hover:-translate-y-0.5 hover:shadow-[0_11px_26px_rgba(232,80,122,0.31)]"
              : "border-nexa-primary/20 bg-white text-nexa-primary shadow-[0_4px_14px_rgba(91,48,67,0.06)] hover:-translate-y-0.5 hover:border-nexa-primary/35 hover:bg-nexa-primary-soft/40 hover:shadow-nexa-sm",
          )}
        >
          {actionLabel(action, t)}
          <ArrowUpRight className={cn("h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100", index === 0 ? "text-white/85" : "text-nexa-primary")} />
        </button>
      ))}
    </div>
  );
}

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
        <div className="mb-7 overflow-hidden rounded-[24px] border border-white bg-nexa-bg-2 shadow-[0_12px_30px_rgba(85,43,62,0.13)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt=""
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : null}
      <h3 className="font-display text-[24px] font-semibold leading-tight text-nexa-ink">
        {module.title}
      </h3>
      {status ? (
        <span className="mt-3 inline-flex rounded-full border border-nexa-primary/15 bg-nexa-primary-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-nexa-primary shadow-[0_2px_8px_rgba(232,80,122,0.07)]">
          {status}
        </span>
      ) : null}
      <dl className="mt-7 space-y-5 text-sm">
        <div className="flex gap-3.5">
          <CalendarDays className="box-content h-4 w-4 shrink-0 rounded-xl bg-nexa-primary-soft p-2 text-nexa-primary" />
          <div>
            <dt className="font-semibold text-nexa-ink">{t("inbox.duration")}</dt>
            <dd className="mt-1 text-nexa-ink-2">
              {formatDate(snapshot.checkinDate, locale)} –{" "}
              {formatDate(snapshot.checkoutDate, locale)}
            </dd>
          </div>
        </div>
        {Number(snapshot.guestCount) > 0 ? (
          <div className="flex gap-3.5">
            <Users className="box-content h-4 w-4 shrink-0 rounded-xl bg-nexa-primary-soft p-2 text-nexa-primary" />
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
            <MapPin className="box-content h-4 w-4 shrink-0 rounded-xl bg-nexa-primary-soft p-2 text-nexa-primary" />
            <div>
              <dt className="font-semibold text-nexa-ink">{t("inbox.location")}</dt>
              <dd className="mt-1 text-nexa-ink-2">{location}</dd>
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
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-nexa-primary/15 bg-[linear-gradient(135deg,#fff,#fce6ec)] text-nexa-primary shadow-nexa-sm">
        <KeyRound className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-display text-[24px] font-semibold text-nexa-ink">
        {t("inbox.context.accessTitle")}
      </h3>
      {module.body ? (
        <p className="mt-2.5 text-sm leading-6 text-nexa-ink-2">{module.body}</p>
      ) : null}
      <div className="mt-7 rounded-[22px] border border-nexa-primary/10 bg-[linear-gradient(145deg,#fff,#fdf3f6)] p-5 shadow-[0_10px_26px_rgba(96,47,69,0.09)]">
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-nexa-primary transition-[background-color,border-color,transform] hover:border-nexa-primary/15 hover:bg-white active:scale-95 motion-reduce:transition-none"
            aria-label={
              revealed
                ? t("inbox.context.hideAccessCode")
                : t("inbox.context.showAccessCode")
            }
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(credential)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-nexa-primary transition-[background-color,border-color,transform] hover:border-nexa-primary/15 hover:bg-white active:scale-95 motion-reduce:transition-none"
            aria-label={t("inbox.context.copyAccessCode")}
          >
            <Copy className="h-4 w-4" />
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
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-nexa-primary/15 bg-[linear-gradient(135deg,#fff,#fce6ec)] text-nexa-primary shadow-nexa-sm">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-display text-[24px] font-semibold leading-tight text-nexa-ink">
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
  conversation,
}) {
  return (
    <BookingModule
      module={module}
      status={
        conversation.presentation.statusChip ??
        conversation.bookingStatus
      }
    />
  );
});

registerContextModuleRenderer("access", function RegisteredAccessModule({ module }) {
  return <AccessModule module={module} />;
});

export function MessagingContextPanel({
  conversation,
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
    state.recommendedId,
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
    const module = state.modules[next];
    if (!module) return;
    setSelectedId(module.id);
    requestAnimationFrame(() =>
      document.getElementById(`context-tab-${module.id}`)?.focus(),
    );
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col border-s border-nexa-primary/10 bg-[linear-gradient(180deg,#fffafb_0%,#fdf7f9_38%,#fff_100%)] shadow-[-18px_0_42px_rgba(102,49,72,0.09)]",
        className,
      )}
    >
      <div className="flex shrink-0 items-start justify-between bg-[radial-gradient(circle_at_top_right,rgba(244,128,154,0.16),transparent_52%)] px-6 pb-5 pt-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-nexa-primary">
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
            className="-me-2 -mt-2 flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-nexa-ink-3 transition-[background-color,border-color,color,transform] hover:border-nexa-primary/15 hover:bg-white hover:text-nexa-primary active:scale-95 motion-reduce:transition-none"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div
        className="flex shrink-0 gap-2 overflow-x-auto border-b border-nexa-primary/10 px-6 pb-3 scrollbar-none"
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
                "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40 active:scale-95",
                active
                  ? "border-nexa-primary/20 bg-[linear-gradient(135deg,#f4809a,#e8507a)] text-white shadow-[0_5px_14px_rgba(232,80,122,0.24)]"
                  : "border-nexa-line/70 bg-white/70 text-nexa-ink-3 hover:border-nexa-primary/20 hover:bg-white hover:text-nexa-primary hover:shadow-sm",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
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
            transition={{ duration: reduceMotion ? 0 : 0.16, ease: "easeOut" }}
            className="m-4 min-h-0 flex-1 overflow-y-auto rounded-[28px] border border-white bg-white/92 px-6 pb-8 pt-6 shadow-[0_16px_44px_rgba(83,42,61,0.10)] backdrop-blur-xl"
          >
            {SelectedModule ? (
              <SelectedModule module={selected} conversation={conversation} />
            ) : (
              <GenericModule module={selected} />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
