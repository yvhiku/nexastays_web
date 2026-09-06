"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import { WIZARD_STICKY_TOP } from "./wizard-chrome";

const K = "hostListing.wizard.celebrate.";

/**
 * The wizard's one deliberate brand moment. Logo mark on `nexa-primary-soft`
 * over a soft CSS lattice (zellige-inspired, built from existing tokens at low
 * opacity). Two animated elements max; respects prefers-reduced-motion.
 */
export function CelebrateScreen({ onCreateAnother }: { onCreateAnother: () => void }) {
  const { t, localePath } = useLanguage();
  const reduce = useReducedMotion();
  const enter = (delay: number) =>
    reduce
      ? { initial: false as const, animate: { opacity: 1, y: 0, scale: 1 } }
      : {
          initial: { opacity: 0, y: 12, scale: 0.98 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16"
      style={{ paddingTop: `calc(${WIZARD_STICKY_TOP} + 4rem)` }}
    >
      {/* Soft lattice motif: two rotated repeating gradients in brand tones. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-nexa-primary-soft"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(45deg, rgba(196,42,88,0.07) 0 2px, transparent 2px 28px)",
            "repeating-linear-gradient(-45deg, rgba(196,42,88,0.07) 0 2px, transparent 2px 28px)",
            "repeating-linear-gradient(0deg, rgba(249,168,108,0.10) 0 2px, transparent 2px 56px)",
            "repeating-linear-gradient(90deg, rgba(249,168,108,0.10) 0 2px, transparent 2px 56px)",
          ].join(","),
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto max-w-lg text-center">
        <motion.div
          {...enter(0)}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-nexa-md"
        >
          <div className="relative h-12 w-12 overflow-hidden rounded-xl">
            <Image src={NEXA_STAYS_LOGO_SRC} alt="Nexa Stays" fill sizes="48px" className="object-cover" />
          </div>
        </motion.div>
        <motion.div {...enter(0.12)}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-nexa-primary">
            {t(K + "eyebrow")}
          </p>
          <h1 className="mt-2 font-sans text-3xl font-semibold tracking-tight text-nexa-ink sm:text-4xl">
            {t(K + "title")}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-nexa-ink-2">{t(K + "body")}</p>
          <p className="mt-2 text-sm text-nexa-ink-3">{t(K + "followUp")}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={localePath("/host/dashboard")}>{t("hostListing.goToDashboard")}</Link>
            </Button>
            <Button variant="outline" size="lg" onClick={onCreateAnother}>
              {t(K + "createAnother")}
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href={localePath("/")}>{t("hostDashboard.backToHome")}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
