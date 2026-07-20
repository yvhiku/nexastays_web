import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { getServerTranslations } from "@/lib/i18n/server";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import { NEXA_CONTACT_EMAILS } from "@/lib/contact-emails";

const INSTAGRAM_LINKS = [
  { href: "https://www.instagram.com/joinnexa/", labelKey: "instagramJoinNexa" as const },
  { href: "https://www.instagram.com/nexastays.ma/", labelKey: "instagramNexaStays" as const },
] as const;

const linkClass = "text-sm text-white/75 transition hover:text-white";

type Props = {
  locale: Locale;
};

export function FooterSection({ locale }: Props) {
  const { t, localePath, isRtl } = getServerTranslations(locale);
  const year = new Date().getFullYear();
  const textStart = isRtl ? "text-right" : "text-left";

  return (
    <footer className="relative border-t border-nexa-ink-2 bg-nexa-ink text-white">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-8 py-12 sm:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={NEXA_STAYS_LOGO_SRC}
              alt="Nexa Stays"
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 object-contain"
            />
            <div>
              <div className="text-lg font-semibold text-white">Nexa Stays</div>
              <div className="text-sm text-nexa-ink-4">{t("footer.tagline")}</div>
            </div>
          </div>
        </div>

        <p className={`mt-8 max-w-3xl text-xs leading-relaxed text-nexa-ink-4 ${textStart}`}>
          {t("footer.disclaimer")}
        </p>

        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/95">
              {t("footer.platform")}
            </h3>
            <ul className={`mt-3 space-y-2 ${textStart}`}>
              <li>
                <Link href={localePath("/listings")} className={linkClass}>
                  {t("nav.stays")}
                </Link>
              </li>
              <li>
                <Link href={localePath("/host")} className={linkClass}>
                  {t("nav.becomeHost")}
                </Link>
              </li>
              <li>
                <Link href={localePath("/login")} className={linkClass}>
                  {t("common.signIn")}
                </Link>
              </li>
              <li>
                <Link href={localePath("/fees")} className={linkClass}>
                  {t("footer.fees")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/95">
              {t("footer.company")}
            </h3>
            <ul className={`mt-3 space-y-2 ${textStart}`}>
              <li>
                <Link href={localePath("/safety-transparency")} className={linkClass}>
                  {t("nav.safetyTransparency")}
                </Link>
              </li>
              <li>
                <Link href={localePath("/about")} className={linkClass}>
                  {t("footer.aboutUs")}
                </Link>
              </li>
              <li>
                <Link href={localePath("/contact")} className={linkClass}>
                  {t("nav.contact")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/95">
              {t("footer.legal")}
            </h3>
            <ul className={`mt-3 space-y-2 ${textStart}`}>
              <li>
                <Link href={localePath("/terms")} className={linkClass}>
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href={localePath("/privacy")} className={linkClass}>
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href={localePath("/refund")} className={linkClass}>
                  {t("footer.refund")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/95">
              {t("footer.contactLabel")}
            </h3>
            <ul className={`mt-3 space-y-2 ${textStart}`}>
              {NEXA_CONTACT_EMAILS.map(({ email, labelKey }) => (
                <li key={email}>
                  <a href={`mailto:${email}`} className={`block break-all ${linkClass}`}>
                    <span className="block text-[0.7rem] uppercase tracking-wide text-white/45">
                      {t(labelKey)}
                    </span>
                    {email}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/95">
            {t("footer.social")}
          </h3>
          <ul
            className={`mt-3 flex flex-wrap gap-4 ${isRtl ? "justify-end" : "justify-start"}`}
          >
            {INSTAGRAM_LINKS.map(({ href, labelKey }) => (
              <li key={href}>
                <Link
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-white/75 transition hover:text-white"
                >
                  <span aria-hidden>📷</span>
                  <span>{t(`footer.${labelKey}`)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={`mt-12 flex flex-col gap-3 border-t border-nexa-ink-2 pt-8 text-xs text-nexa-ink-4 sm:flex-row sm:items-center sm:justify-between ${
            isRtl ? "sm:flex-row-reverse" : ""
          }`}
        >
          <p>{t("footer.secured")}</p>
          <p className={isRtl ? "text-right sm:text-left" : "text-left sm:text-right"}>
            © {year} Nexa — Morocco · {t("footer.rightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}
