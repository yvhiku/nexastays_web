"use client";

import { motion } from "framer-motion";
import { StayExampleCard } from "@/components/home/StayExampleCard";

export function HowItWorksVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl sm:rounded-[32px] shadow-nexa-lg h-[320px] sm:h-[400px] lg:h-[520px] relative min-h-[280px] isolate overflow-hidden"
    >
      <StayExampleCard layout="panel" />
    </motion.div>
  );
}
