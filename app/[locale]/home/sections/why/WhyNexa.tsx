"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export const WhyNexaSection = () => {
  const { t } = useLanguage();
  const whyCards = [
    { icon: "🛡️", titleKey: "home.why.safety", descKey: "home.why.safetyDesc" },
    { icon: "🔍", titleKey: "home.why.transparency", descKey: "home.why.transparencyDesc" },
    { icon: "🤝", titleKey: "home.why.comfort", descKey: "home.why.comfortDesc" },
  ];
  return (
    <section className="py-16 sm:py-20 md:py-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-3">
            {t("home.why.eyebrow")}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-nexa-ink mb-4">
            {t("home.why.title")}
          </h2>
          <p className="max-w-[640px] mx-auto text-base">
            {t("home.why.subtitle")}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyCards.map((card, i) => (
            <motion.div
              key={card.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[22px] p-8 pt-7 border border-nexa-line shadow-nexa-card hover:-translate-y-1.5 hover:shadow-nexa-md hover:border-nexa-primary/20 transition-all duration-250"
            >
              <div className="text-3xl mb-4">{card.icon}</div>
              <h3 className="text-lg font-semibold text-nexa-ink mb-2.5">
                {t(card.titleKey)}
              </h3>
              <p className="text-sm text-nexa-ink-3">{t(card.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
