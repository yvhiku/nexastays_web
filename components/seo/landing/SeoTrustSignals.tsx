import { useLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { CheckCircle2, Shield, CreditCard, BadgeCheck } from "lucide-react";

type Props = { compact?: boolean };

export function SeoTrustSignals({ compact }: Props) {
  const { t } = useLanguage();
  const items = [
    { icon: BadgeCheck, label: t("seo.compareDetails") },
    { icon: Shield, label: t("seo.checkRules") },
    { icon: CreditCard, label: t("seo.reviewPrice") },
  ];
  return (
    <ul
      className={`flex flex-wrap gap-x-4 gap-y-2 ${compact ? "text-xs" : "text-sm"} text-white/90`}
    >
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}

export function SeoTrustSignalsLight() {
  const { t } = useLanguage();
  const items = [t("seo.compareDetails"), t("seo.checkRules"), t("seo.reviewPrice")];
  return (
    <p className="text-xs text-nexa-muted flex flex-wrap gap-x-3 gap-y-1">
      {items.map((label) => (
        <span key={label} className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-nexa-primary" aria-hidden />
          {label}
        </span>
      ))}
    </p>
  );
}
