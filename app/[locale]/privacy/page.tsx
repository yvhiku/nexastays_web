"use client";

import React from "react";
import Link from "next/link";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { NEXA_CONTACT_EMAIL, NEXA_SUPPORT_EMAIL } from "@/lib/contact-emails";

const privacySections = [
  { id: "p1", label: "1. Who We Are" },
  { id: "p2", label: "2. Information We Collect" },
  { id: "p3", label: "3. Why We Collect" },
  { id: "p4", label: "4. Contact Masking" },
  { id: "p5", label: "5. When We Share" },
  { id: "p6", label: "6. Data Retention" },
  { id: "p7", label: "7. Security" },
  { id: "p8", label: "8. Your Rights" },
  { id: "p9", label: "9. Children" },
  { id: "p10", label: "10. Updates" },
  { id: "p11", label: "11. Contact" },
];

export default function PrivacyPage() {
  const { t, localePath } = useLanguage();
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Effective Date: 24 February 2026 · How we collect, use, and protect your information."
      sections={privacySections}
      otherLinks={[
        { href: "/terms", label: "Terms & Conditions" },
        { href: "/refund", label: "Refund Policy" },
      ]}
    >
      <div className="[&_h2]:text-xl [&_h2]:mt-11 [&_h2]:mb-3 [&_h2]:pb-2.5 [&_h2]:border-b [&_h2]:border-nexa-line [&_h2]:first:mt-0 [&_h3]:text-base [&_h3]:mt-5 [&_h3]:mb-2.5 [&_h3]:text-nexa-ink-2 [&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-nexa-ink-2 [&_h4]:mb-2 [&_p]:mb-3.5 [&_p]:text-sm [&_ul]:pl-5 [&_ul]:mb-3.5 [&_li]:text-sm [&_li]:text-nexa-ink-3 [&_li]:mb-2 [&_li]:marker:text-nexa-primary">
        <h2 id="p1">1. Who We Are</h2>
        <p>
          Nexa Stays (&quot;Nexa&quot;) provides a booking and property-listing platform
          for hotels and apartments. This Privacy Policy explains how we collect,
          use, share, and protect personal information.
        </p>
        <h2 id="p2">2. Information We Collect</h2>
        <div className="bg-nexa-bg-2 rounded-xl p-5 px-6 my-4">
          <h4 className="mb-2">A) Information you provide</h4>
          <ul>
            <li>
              <strong>Account details:</strong> full legal name, phone number,
              email, password (hashed)
            </li>
            <li>
              <strong>Identity verification:</strong> government ID type/number,
              ID images, profile photo
            </li>
            <li>
              <strong>Booking information:</strong> reservation details,
              declared occupants, messages
            </li>
            <li>
              <strong>Host information:</strong> property details, check-in
              contact, payout/bank info
            </li>
          </ul>
        </div>
        <div className="bg-nexa-bg-2 rounded-xl p-5 px-6 my-4">
          <h4 className="mb-2">B) Automatically collected</h4>
          <ul>
            <li>
              Device and usage data (interactions, log events, IP, approximate
              location)
            </li>
            <li>Cookies/local storage for session, security, and analytics</li>
          </ul>
        </div>
        <div className="bg-nexa-bg-2 rounded-xl p-5 px-6 my-4">
          <h4 className="mb-2">C) Payments</h4>
          <p>
            We do not store raw card details. Payments handled by external PSPs.
            We may store tokens and transaction references.
          </p>
        </div>
        <h2 id="p3">3. Why We Collect and Use Information</h2>
        <ul>
          <li>Create and manage accounts</li>
          <li>Verify identity and enforce safety requirements</li>
          <li>Facilitate bookings, confirmations, cancellations, and refunds</li>
          <li>Prevent fraud, abuse, and policy violations</li>
          <li>Provide customer support and dispute resolution</li>
          <li>Meet legal or regulatory obligations</li>
        </ul>
        <h2 id="p4">4. Contact Masking and Privacy-by-Design</h2>
        <div className="bg-nexa-primary-soft border-l-4 border-nexa-primary rounded-r-lg py-3.5 px-4 my-4 text-sm text-nexa-primary-dark">
          Phone numbers, emails, and exact addresses are masked until both sides
          are verified and a reservation is confirmed. Before confirmation,
          communication is handled through in-platform messaging.
        </div>
        <h2 id="p5">5. When We Share Information</h2>
        <h3>A) Between guests and hosts</h3>
        <p>
          After booking is confirmed (and both verified), we share relevant
          identity and booking details for safe check-in and compliance.
        </p>
        <h3>B) Service providers</h3>
        <p>
          We share data with providers who help run the platform (hosting,
          analytics, messaging, payment). They must protect data and use it only
          for Nexa services.
        </p>
        <h3>C) Legal reasons</h3>
        <p>
          We may disclose information if required by law, court order, or to
          protect platform integrity.
        </p>
        <h2 id="p6">6. Data Retention</h2>
        <p>
          We keep personal data only as long as necessary for active account
          operations, dispute resolution, fraud prevention, and legal
          obligations. Verification data may be retained longer for security or
          audits.
        </p>
        <h2 id="p7">7. Security Measures</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <div className="bg-white border border-nexa-line rounded-xl p-3.5 text-center text-sm text-nexa-ink-3">
            <span className="text-2xl block mb-1.5">🔐</span>
            Encryption for sensitive fields
          </div>
          <div className="bg-white border border-nexa-line rounded-xl p-3.5 text-center text-sm text-nexa-ink-3">
            <span className="text-2xl block mb-1.5">👥</span>
            Access controls & permissions
          </div>
          <div className="bg-white border border-nexa-line rounded-xl p-3.5 text-center text-sm text-nexa-ink-3">
            <span className="text-2xl block mb-1.5">📋</span>
            Logging and monitoring
          </div>
        </div>
        <p className="mt-3.5 text-sm text-nexa-ink-4">
          No system is perfectly secure, but we work to reduce risks
          significantly.
        </p>
        <h2 id="p8">8. Your Choices and Rights</h2>
        <p>
          Depending on applicable law, you may request access, correction,
          deletion, or account closure. Requests can be made via{" "}
          <Link href={localePath("/contact")} className="text-nexa-primary hover:underline">
            customer support
          </Link>
          .
        </p>
        <h2 id="p9">9. Children</h2>
        <p>
          Nexa Stays is not intended for children. If we learn we collected data
          from a child unlawfully, we will delete it.
        </p>
        <h2 id="p10">10. Updates to This Policy</h2>
        <p>
          We may update this policy to reflect changes in the platform or legal
          requirements. We will post the updated policy with a revised effective
          date.
        </p>
        <h2 id="p11">11. Contact</h2>
        <div className="bg-nexa-bg-2 rounded-[22px] p-6">
          <h3 className="text-base mb-3">{t("privacy.forPrivacyQuestions")}</h3>
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
