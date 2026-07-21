"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { DESTINATION_IMAGES } from "@/lib/destination-assets";

const destinations = [
  { img: DESTINATION_IMAGES.marrakech, city: "Marrakech", titleKey: "home.destinations.marrakech", subtitleKey: "home.destinations.marrakechSub", span: 2 },
  { img: DESTINATION_IMAGES.agadir, city: "Agadir", titleKey: "home.destinations.agadir", subtitleKey: "home.destinations.agadirSub", span: 1 },
  { img: DESTINATION_IMAGES.tangier, city: "Tangier", titleKey: "home.destinations.tangier", subtitleKey: "home.destinations.tangierSub", span: 1 },
  { img: DESTINATION_IMAGES.casablanca, city: "Casablanca", titleKey: "home.destinations.casablanca", subtitleKey: "home.destinations.casablancaSub", span: 1 },
  { img: DESTINATION_IMAGES.fes, city: "Fes", titleKey: "home.destinations.fes", subtitleKey: "home.destinations.fesSub", span: 1 },
];

export const DestinationsSection = () => {
  const { t, localePath } = useLanguage();
  return (
    <section className="py-16 sm:py-20 md:py-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-9"
        >
          <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-3">
            {t("home.destinations.eyebrow")}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-nexa-ink">
            {t("home.destinations.title")}
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {destinations.map((dest, i) => (
            <motion.div
              key={dest.titleKey}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-[22px] overflow-hidden relative cursor-pointer hover:scale-[1.02] transition-transform ${
                dest.span === 2 ? "sm:row-span-2 sm:min-h-[440px]" : ""
              }`}
            >
              <Link
                href={localePath(`/listings?city=${encodeURIComponent(dest.city)}`)}
                className="block h-full"
              >
                <div className="relative h-[220px] min-h-[220px] sm:h-full">
                  <Image
                    src={dest.img}
                    alt={t(dest.titleKey)}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-nexa-ink/65 to-transparent" />
                  <div className="absolute bottom-5 left-5">
                    <h3 className="font-display text-xl font-semibold text-white">
                      {t(dest.titleKey)}
                    </h3>
                    <span className="text-white/80 text-sm">{t(dest.subtitleKey)}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-9"
        >
          <Button variant="outline" asChild>
            <Link href={localePath("/listings")}>{t("home.destinations.exploreAll")}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
