"use client";

import React from "react";
import Link from "next/link";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  sections: { id: string; label: string }[];
  otherLinks: { href: string; label: string }[];
  children: React.ReactNode;
}

export function LegalLayout({
  title,
  subtitle,
  sections,
  otherLinks,
  children,
}: LegalLayoutProps) {
  const { t, localePath } = useLanguage();
  return (
    <>
      <NavBar />
      <main className="pt-[72px]">
        <section className="bg-gradient-to-br from-nexa-primary-soft to-nexa-bg pt-10 sm:pt-14 pb-10 sm:pb-16 border-b border-nexa-line">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-3">
              {t("legalLayout.legal")}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-nexa-ink mb-4">{title}</h1>
            <p className="max-w-[580px] text-base sm:text-lg">{subtitle}</p>
          </div>
        </section>

        <section className="py-8 sm:py-14">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-0">
            <aside className="lg:sticky lg:top-[calc(72px+32px)] lg:self-start h-fit lg:pr-10 lg:border-r lg:border-nexa-line pt-2 lg:mb-0 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-nexa-ink-4 mb-3.5">
                {t("legalLayout.sections")}
              </h4>
              <nav className="flex flex-col gap-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="text-sm text-nexa-ink-3 py-1.5 px-3 rounded-lg hover:bg-nexa-primary-soft hover:text-nexa-primary transition-colors block"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
              <div className="mt-7 pt-5 border-t border-nexa-line">
                {otherLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={localePath(link.href)}
                    className="block text-sm text-nexa-ink-3 mb-2 hover:text-nexa-primary transition-colors"
                  >
                    → {link.label}
                  </Link>
                ))}
              </div>
            </aside>
            <div className="pl-0 lg:pl-14 pb-20">{children}</div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
