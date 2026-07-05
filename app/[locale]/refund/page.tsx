"use client";

import React from "react";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { NEXA_SUPPORT_EMAIL } from "@/lib/contact-emails";

const refundSections = [
  { id: "r1", label: "1. Purpose" },
  { id: "r2", label: "2. Principles" },
  { id: "r3", label: "3. Guest Eligibility" },
  { id: "r4", label: "4. Proof Requirements" },
  { id: "r5", label: "5. False Claims" },
  { id: "r6", label: "6. Host Issues" },
  { id: "r7", label: "7. Cancellations" },
  { id: "r8", label: "8. Processing" },
  { id: "r9", label: "9. Abuse Prevention" },
  { id: "r10", label: "10. Contact" },
];

export default function RefundPage() {
  const { t } = useLanguage();
  return (
    <LegalLayout
      title="Refund Policy"
      subtitle="Effective Date: 24 February 2026 · We protect both guests and hosts with evidence-based resolution."
      sections={refundSections}
      otherLinks={[
        { href: "/terms", label: "Terms & Conditions" },
        { href: "/privacy", label: "Privacy Policy" },
      ]}
    >
      <div className="[&_h2]:text-xl [&_h2]:mt-11 [&_h2]:mb-3 [&_h2]:pb-2.5 [&_h2]:border-b [&_h2]:border-nexa-line [&_h2]:first:mt-0 [&_h3]:text-base [&_h3]:mt-5 [&_h3]:mb-2.5 [&_h3]:text-nexa-ink-2 [&_p]:mb-3.5 [&_p]:text-sm [&_ul]:pl-5 [&_ul]:mb-3.5 [&_li]:text-sm [&_li]:text-nexa-ink-3 [&_li]:mb-2 [&_li]:marker:text-nexa-primary">
        <h2 id="r1">1. Purpose</h2>
        <p>
          This Refund Policy explains when refunds may be issued and how disputes
          are handled fairly for both guests and hosts.
        </p>
        <h2 id="r2">2. Important Principles</h2>
        <ul>
          <li>Refunds depend on the booking status, timing, and evidence.</li>
          <li>
            Nexa Stays aims to protect both sides using an evidence-based
            process.
          </li>
          <li>
            All refund requests must be submitted through Nexa Stays support with
            supporting proof where required.
          </li>
        </ul>
        <h2 id="r3">3. Cases Where a Guest May Be Eligible for a Refund</h2>
        <p>Refund eligibility may apply when:</p>
        <ul>
          <li>
            The property is materially different from what was booked
            (significant mismatch, not minor differences).
          </li>
          <li>The location is not the same as advertised (bait-and-switch).</li>
          <li>Host fails to provide check-in access without a valid solution.</li>
          <li>
            Confirmed safety or compliance issue prevents staying.
          </li>
        </ul>
        <h2 id="r4">4. Proof Requirements for &quot;Not as Advertised&quot; Claims</h2>
        <p>The guest must provide proof, including where possible:</p>
        <div className="flex flex-col gap-2.5 mt-3">
          {[
            { icon: "📸", text: "Photos/videos taken on arrival" },
            { icon: "📍", text: "GPS/location evidence (map, timestamps)" },
            { icon: "📋", text: "Screenshots of the original listing" },
            { icon: "💬", text: "Message history with the host" },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-2.5 py-3 px-4 bg-white border border-nexa-line rounded-xl text-sm text-nexa-ink-3"
            >
              <span>{item.icon}</span> {item.text}
            </div>
          ))}
        </div>
        <div className="bg-nexa-accent-soft border-l-4 border-nexa-accent rounded-r-lg py-3.5 px-4 my-4 text-sm text-amber-900">
          Failure to provide reasonable proof may result in rejection or partial
          refund.
        </div>
        <h2 id="r5">
          5. False or Unsupported Claims — Partial Refund Rule
        </h2>
        <p>
          If the investigation determines the property was not materially
          different and the claim was unsupported or the guest simply changed
          their mind:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          <div className="rounded-xl p-4 text-center bg-green-50">
            <div className="font-display text-3xl font-bold text-green-700">60%</div>
            <div className="text-sm text-green-700 mt-1">Refunded to guest</div>
          </div>
          <div className="rounded-xl p-4 text-center bg-nexa-primary-soft">
            <div className="font-display text-3xl font-bold text-nexa-primary">
              25%
            </div>
            <div className="text-sm text-nexa-primary-dark mt-1">Paid to host</div>
          </div>
          <div className="rounded-xl p-4 text-center bg-nexa-bg-2">
            <div className="font-display text-3xl font-bold text-nexa-ink-3">
              15%
            </div>
            <div className="text-sm text-nexa-ink-4 mt-1">Retained by Nexa</div>
          </div>
        </div>
        <div className="bg-nexa-primary-soft border-l-4 border-nexa-primary rounded-r-lg py-3.5 px-4 my-4 text-sm text-nexa-primary-dark">
          This rule exists to protect hosts from unfair losses while still
          providing a fair outcome.
        </div>
        <h2 id="r6">6. Host-Initiated Issues</h2>
        <p>
          If a host adds fees after booking that were not disclosed, changes
          rules materially, asks the guest to leave early without valid cause,
          or creates unreasonable requirements, Nexa Stays may issue a refund or
          partial refund based on severity, timing, and evidence.
        </p>
        <h2 id="r7">7. Standard Cancellations and Timing</h2>
        <p>
          Refund outcomes vary based on: cancellation time relative to check-in,
          whether the stay has started, host cancellation policy, and whether a
          dispute is involved. Nexa Stays may enforce default cancellation
          options depending on listing type and local requirements.
        </p>
        <h2 id="r8">8. How the Refund is Processed</h2>
        <ul>
          <li>
            Approved refunds are sent to the original payment method where
            possible.
          </li>
          <li>Processing times depend on the payment provider and banks.</li>
          <li>
            Some transaction fees may be non-refundable where permitted by law.
          </li>
        </ul>
        <h2 id="r9">9. Abuse Prevention</h2>
        <p>
          Repeated refund abuse, false claims, or manipulation may result in
          account restrictions, suspension, or permanent removal from the
          platform.
        </p>
        <h2 id="r10">10. Contact</h2>
        <div className="bg-nexa-bg-2 rounded-[22px] p-6">
          <h3 className="text-base mb-3">
            {t("refund.refundRequests")}
          </h3>
          <p className="text-nexa-primary text-sm">
            <a href={`mailto:${NEXA_SUPPORT_EMAIL}`} className="hover:underline">
              {NEXA_SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </LegalLayout>
  );
}
