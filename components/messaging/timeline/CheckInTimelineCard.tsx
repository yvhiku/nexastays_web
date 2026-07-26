"use client";

import React, { useState } from "react";
import { ChevronDown, House } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { SignedMedia } from "@/lib/messaging/messages-api";
import { cn } from "@/lib/utils";
import { BookingHero } from "./BookingHero";
import { ArrivalSummary } from "./ArrivalSummary";
import {
  ArrivalChecklist,
  type ArrivalChecklistItem,
} from "./ArrivalChecklist";
import { AccessPreview } from "./AccessPreview";
import { HouseRulesPreview } from "./HouseRulesPreview";
import { LocationPreview } from "./LocationPreview";

type Section = {
  id: "arrival" | "location" | "access" | "rules" | "checklist";
  label: string;
  content: React.ReactNode;
};

type Props = {
  propertyName: string;
  cover?: SignedMedia | null;
  welcomeTitle: string;
  arrivalLabel: string;
  arrivalStatus?: string;
  checkInDate?: string | null;
  checkInTime?: string | null;
  timezone?: string | null;
  address?: string | null;
  mapActionLabel?: string;
  onOpenMap?: () => void;
  accessAvailable: boolean;
  rules: string[];
  checklist: ArrivalChecklistItem[];
  labels: {
    propertyImage: string;
    retryImage: string;
    location: string;
    access: string;
    accessAvailable: string;
    houseRules: string;
    checklist: string;
  };
};

export function CheckInTimelineCard({
  propertyName,
  cover,
  welcomeTitle,
  arrivalLabel,
  arrivalStatus,
  checkInDate,
  checkInTime,
  timezone,
  address,
  mapActionLabel,
  onOpenMap,
  accessAvailable,
  rules,
  checklist,
  labels,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [openSections, setOpenSections] = useState<Set<Section["id"]>>(
    () => new Set(["arrival"]),
  );
  const sections: Section[] = [
    {
      id: "arrival",
      label: arrivalLabel,
      content: (
        <ArrivalSummary
          heading={arrivalLabel}
          date={checkInDate}
          time={checkInTime}
          timezone={timezone}
        />
      ),
    },
    ...(address
      ? [{
          id: "location" as const,
          label: labels.location,
          content: (
            <LocationPreview
              title={labels.location}
              address={address}
              actionLabel={mapActionLabel}
              onOpen={onOpenMap}
            />
          ),
        }]
      : []),
    ...(accessAvailable
      ? [{
          id: "access" as const,
          label: labels.access,
          content: (
            <AccessPreview
              title={labels.access}
              availableLabel={labels.accessAvailable}
            />
          ),
        }]
      : []),
    ...(rules.length
      ? [{
          id: "rules" as const,
          label: labels.houseRules,
          content: <HouseRulesPreview title={labels.houseRules} rules={rules} />,
        }]
      : []),
    {
      id: "checklist",
      label: labels.checklist,
      content: <ArrivalChecklist label={labels.checklist} items={checklist} />,
    },
  ];

  const toggle = (id: Section["id"]) => {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="relative mx-auto w-full max-w-[560px] px-3 sm:px-0">
      <motion.article
        role="article"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
        className="overflow-hidden rounded-[20px] border border-nexa-line/90 bg-white shadow-messaging-1 transition-shadow duration-messaging-hover hover:shadow-messaging-2 motion-reduce:transition-none"
        style={{ contentVisibility: "auto", containIntrinsicSize: "520px" }}
      >
        <BookingHero
          cover={cover}
          propertyName={propertyName}
          fallbackLabel={labels.propertyImage}
          retryLabel={labels.retryImage}
          compact
        />
        <header className="flex items-start gap-3 border-b border-nexa-line/70 p-5 max-[419px]:p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-nexa-primary-soft text-nexa-primary">
            <House className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-6 text-nexa-ink">
              {welcomeTitle}
            </h3>
            <p className="mt-1 truncate text-sm font-medium text-nexa-ink-2">
              {propertyName}
            </p>
            {arrivalStatus ? (
              <p className="mt-1 text-xs font-semibold text-nexa-primary">
                {arrivalStatus}
              </p>
            ) : null}
          </div>
        </header>

        <div className="divide-y divide-nexa-line/70">
          {sections.map((section, index) => {
            const open = openSections.has(section.id);
            const panelId = `checkin-${section.id}-panel`;
            return (
              <motion.section
                key={section.id}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.04 }}
              >
                <button
                  type="button"
                  onClick={() => toggle(section.id)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 px-5 py-3 text-start text-sm font-semibold text-nexa-ink-2 transition-colors hover:bg-nexa-bg/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-nexa-primary/40 max-[419px]:px-4"
                  aria-expanded={open}
                  aria-controls={panelId}
                >
                  {section.label}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-nexa-ink-4 transition-transform duration-messaging-message motion-reduce:transition-none",
                      open && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      id={panelId}
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 max-[419px]:px-4">
                        {section.content}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.section>
            );
          })}
        </div>
      </motion.article>
    </div>
  );
}
