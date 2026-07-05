"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStaysFees } from "@/contexts/StaysFeeContext";

export const StatsSection = () => {
  const { t } = useLanguage();
  const { rates } = useStaysFees();
  const statKeys = [
    { labelKey: "home.stats.controlledLaunch" },
    { labelKey: "home.stats.casablancaFirst" },
    { labelKey: "home.stats.verifiedListings" },
    { labelKey: "home.stats.guestFee", value: `${rates.guest_fee_percent}%` },
  ];
  return (
    <section className="bg-gradient-to-br from-nexa-primary to-nexa-primary-dark py-12 sm:py-14 md:py-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {statKeys.map((stat, i) => (
            <motion.div
              key={stat.labelKey}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              {stat.value && (
                <div className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
              )}
              <div className={stat.value ? "text-sm text-white/75" : "text-base sm:text-lg font-semibold text-white/90"}>
                {t(stat.labelKey)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
