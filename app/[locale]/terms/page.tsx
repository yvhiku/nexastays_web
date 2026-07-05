"use client";

import React from "react";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { NEXA_CONTACT_EMAIL, NEXA_SUPPORT_EMAIL } from "@/lib/contact-emails";

export default function TermsPage() {
  const { t, localePath } = useLanguage();

  const termsSections = [
    { id: "t1", label: t("terms.s1") },
    { id: "t2", label: t("terms.s2") },
    { id: "t3", label: t("terms.s3") },
    { id: "t4", label: t("terms.s4") },
    { id: "t5", label: t("terms.s5") },
    { id: "t6", label: t("terms.s6") },
    { id: "t7", label: t("terms.s7") },
    { id: "t8", label: t("terms.s8") },
    { id: "t9", label: t("terms.s9") },
    { id: "t10", label: t("terms.s10") },
    { id: "t11", label: t("terms.s11") },
    { id: "t12", label: t("terms.s12") },
    { id: "t13", label: t("terms.s13") },
    { id: "t14", label: t("terms.s14") },
    { id: "t15", label: t("terms.s15") },
    { id: "t16", label: t("terms.s16") },
  ];

  return (
    <LegalLayout
      title={t("terms.title")}
      subtitle={t("terms.subtitle")}
      sections={termsSections}
      otherLinks={[
        { href: "/privacy", label: t("footer.privacy") },
        { href: "/refund", label: t("footer.refund") },
      ]}
    >
      <div className="max-w-none [&_h2]:text-xl [&_h2]:mt-11 [&_h2]:mb-3 [&_h2]:pb-2.5 [&_h2]:border-b [&_h2]:border-nexa-line [&_h2]:first:mt-0 [&_h3]:text-base [&_h3]:mt-5 [&_h3]:mb-2.5 [&_h3]:text-nexa-ink-2 [&_p]:mb-3.5 [&_p]:text-sm [&_ul]:pl-5 [&_ul]:mb-3.5 [&_li]:text-sm [&_li]:text-nexa-ink-3 [&_li]:mb-2 [&_li]:marker:text-nexa-primary">
        <h2 id="t1">{t("terms.s1")}</h2>
        <p>{t("terms.agreementBody")}</p>
        <h2 id="t2">{t("terms.s2")} and Accounts</h2>
        <p>{t("terms.eligibilityBody")}</p>
        <h2 id="t3">{t("terms.s3")}</h2>
        <p>{t("terms.idVerificationIntro")}</p>
        <ul>
          <li>{t("terms.bookingStays")}</li>
          <li>{t("terms.publishingListings")}</li>
          <li>{t("terms.receivingPayouts")}</li>
        </ul>
        <p>{t("terms.idVerificationEnd")}</p>
        <h2 id="t4">{t("terms.s4")} and Platform Communication</h2>
        <p>{t("terms.contactMaskingBody")}</p>
        <div className="bg-nexa-primary-soft border-l-4 border-nexa-primary rounded-r-lg py-3.5 px-4 my-4 text-sm text-nexa-primary-dark">
          {t("terms.noBypassNote")}
        </div>
        <h2 id="t5">5. Listings and {t("terms.s5")}</h2>
        <p>{t("terms.hostRespIntro")}</p>
        <ul>
          <li>{t("terms.correctDesc")}</li>
          <li>{t("terms.accurateLocation")}</li>
          <li>{t("terms.disclosedFees")}</li>
          <li>{t("terms.requiredMedia")}</li>
        </ul>
        <div className="bg-nexa-primary-soft border-l-4 border-nexa-primary rounded-r-lg py-3.5 px-4 my-4 text-sm text-nexa-primary-dark">
          {t("terms.noUndisclosedFees")}
        </div>
        <h2 id="t6">{t("terms.s6")}</h2>
        <p>{t("terms.guestRespIntro")}</p>
        <ul>
          <li>{t("terms.accurateOccupants")}</li>
          <li>{t("terms.respectRules")}</li>
          <li>{t("terms.avoidDamage")}</li>
        </ul>
        <p>{t("terms.guestRespEnd")}</p>
        <h2 id="t7">7. Occupants Declaration</h2>
        <p>{t("terms.occupantsBody")}</p>
        <h2 id="t8">{t("terms.s8")}</h2>
        <p>{t("terms.paymentsBody")}</p>
        <h2 id="t9">9. Cancellations, Disputes, and Refunds</h2>
        <p>
          {t("terms.refundsBodyPrefix")}
          <Link href={localePath("/refund")} className="text-nexa-primary hover:underline">
            {t("footer.refund")}
          </Link>
          {t("terms.refundsBodySuffix")}
        </p>
        <h2 id="t10">10. Reviews, Ratings, and Content</h2>
        <p>{t("terms.reviewsBody")}</p>
        <h2 id="t11">{t("terms.s11")}</h2>
        <p>{t("terms.prohibitedIntro")}</p>
        <ul>
          <li>{t("terms.fraud")}</li>
          <li>{t("terms.bypassPlatform")}</li>
          <li>{t("terms.harass")}</li>
          <li>{t("terms.illegalContent")}</li>
          <li>{t("terms.exploitRefunds")}</li>
        </ul>
        <h2 id="t12">12. Suspension and Termination</h2>
        <p>{t("terms.suspensionBody")}</p>
        <h2 id="t13">13. Limitation of Liability</h2>
        <p>{t("terms.liabilityBody")}</p>
        <h2 id="t14">{t("terms.s14")}</h2>
        <p>{t("terms.changesBody")}</p>
        <h2 id="t15">{t("terms.s15")}</h2>
        <p>{t("terms.localComplianceBody")}</p>
        <h2 id="t16">{t("terms.s16")}</h2>
        <div className="bg-nexa-bg-2 rounded-[22px] p-6">
          <h3 className="text-base mb-3">{t("terms.reachNexa")}</h3>
          <p className="text-nexa-primary text-sm space-y-1">
            <a href={`mailto:${NEXA_CONTACT_EMAIL}`} className="block hover:underline">
              {NEXA_CONTACT_EMAIL}
            </a>
            <a href={`mailto:${NEXA_SUPPORT_EMAIL}`} className="block hover:underline">
              {NEXA_SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </LegalLayout>
  );
}
