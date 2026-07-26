import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export type PublicStaticRoute =
  | "home"
  | "listings"
  | "host"
  | "about"
  | "contact"
  | "fees"
  | "safety-transparency"
  | "terms"
  | "privacy"
  | "refund";

const COPY: Record<
  PublicStaticRoute,
  Record<Locale, { title: string; description: string }>
> = {
  home: {
    en: {
      title: "Nexa Stays | Verified Stays in Morocco",
      description: "Book verified stays across Morocco with transparent fees and trusted guest-host experiences.",
    },
    fr: {
      title: "Nexa Stays | Séjours vérifiés au Maroc",
      description: "Réservez des séjours vérifiés au Maroc avec des frais transparents et une expérience de confiance.",
    },
    ar: {
      title: "Nexa Stays | إقامات موثقة في المغرب",
      description: "احجز إقامات موثقة في المغرب برسوم شفافة وتجربة موثوقة بين الضيوف والمضيفين.",
    },
  },
  listings: {
    en: {
      title: "Explore Verified Stays in Morocco | Nexa Stays",
      description: "Search verified apartments, villas, riads, hotels, and hostels across Morocco.",
    },
    fr: {
      title: "Découvrez des séjours vérifiés au Maroc | Nexa Stays",
      description: "Recherchez des appartements, villas, riads, hôtels et auberges vérifiés au Maroc.",
    },
    ar: {
      title: "اكتشف إقامات موثقة في المغرب | Nexa Stays",
      description: "ابحث عن شقق وفيلات ورياض وفنادق ونُزل موثقة في مختلف أنحاء المغرب.",
    },
  },
  host: {
    en: {
      title: "Become a Host in Morocco | Nexa Stays",
      description: "List your property with Nexa Stays and host guests through a safer, transparent platform.",
    },
    fr: {
      title: "Devenez hôte au Maroc | Nexa Stays",
      description: "Publiez votre logement sur Nexa Stays et accueillez des voyageurs sur une plateforme sûre et transparente.",
    },
    ar: {
      title: "كن مضيفاً في المغرب | Nexa Stays",
      description: "أضف عقارك إلى Nexa Stays واستقبل الضيوف عبر منصة أكثر أماناً وشفافية.",
    },
  },
  about: {
    en: { title: "About Nexa Stays", description: "Learn how Nexa Stays is building safer, more transparent hospitality in Morocco." },
    fr: { title: "À propos de Nexa Stays", description: "Découvrez comment Nexa Stays développe une hospitalité plus sûre et transparente au Maroc." },
    ar: { title: "عن Nexa Stays", description: "تعرّف على كيفية بناء Nexa Stays لتجربة ضيافة أكثر أماناً وشفافية في المغرب." },
  },
  contact: {
    en: { title: "Contact Nexa Stays", description: "Contact Nexa Stays for booking, hosting, safety, or account support." },
    fr: { title: "Contacter Nexa Stays", description: "Contactez Nexa Stays pour toute aide concernant une réservation, l'accueil, la sécurité ou votre compte." },
    ar: { title: "تواصل مع Nexa Stays", description: "تواصل مع Nexa Stays للمساعدة في الحجوزات أو الاستضافة أو السلامة أو الحساب." },
  },
  fees: {
    en: { title: "Nexa Stays Fees", description: "Understand Nexa Stays guest and host fees with clear, transparent pricing." },
    fr: { title: "Frais Nexa Stays", description: "Comprenez les frais voyageurs et hôtes de Nexa Stays grâce à une tarification claire." },
    ar: { title: "رسوم Nexa Stays", description: "تعرّف على رسوم الضيوف والمضيفين في Nexa Stays بتسعير واضح وشفاف." },
  },
  "safety-transparency": {
    en: { title: "Safety & Transparency | Nexa Stays", description: "Explore the identity, property, payment, and trust measures used by Nexa Stays." },
    fr: { title: "Sécurité et transparence | Nexa Stays", description: "Découvrez les mesures d'identité, de logement, de paiement et de confiance de Nexa Stays." },
    ar: { title: "السلامة والشفافية | Nexa Stays", description: "اكتشف إجراءات الهوية والعقارات والدفع والثقة التي تعتمدها Nexa Stays." },
  },
  terms: {
    en: { title: "Terms of Service | Nexa Stays", description: "Read the terms that govern use of the Nexa Stays platform." },
    fr: { title: "Conditions d'utilisation | Nexa Stays", description: "Consultez les conditions qui régissent l'utilisation de la plateforme Nexa Stays." },
    ar: { title: "شروط الاستخدام | Nexa Stays", description: "اقرأ الشروط التي تنظّم استخدام منصة Nexa Stays." },
  },
  privacy: {
    en: { title: "Privacy Policy | Nexa Stays", description: "Learn how Nexa Stays collects, uses, and protects personal information." },
    fr: { title: "Politique de confidentialité | Nexa Stays", description: "Découvrez comment Nexa Stays collecte, utilise et protège les données personnelles." },
    ar: { title: "سياسة الخصوصية | Nexa Stays", description: "تعرّف على كيفية جمع Nexa Stays للمعلومات الشخصية واستخدامها وحمايتها." },
  },
  refund: {
    en: { title: "Refund Policy | Nexa Stays", description: "Review Nexa Stays cancellation and refund rules for guests and hosts." },
    fr: { title: "Politique de remboursement | Nexa Stays", description: "Consultez les règles d'annulation et de remboursement pour les voyageurs et les hôtes." },
    ar: { title: "سياسة الاسترداد | Nexa Stays", description: "راجع قواعد الإلغاء واسترداد الأموال للضيوف والمضيفين في Nexa Stays." },
  },
};

const PATHS: Record<PublicStaticRoute, string> = {
  home: "",
  listings: "/listings",
  host: "/host",
  about: "/about",
  contact: "/contact",
  fees: "/fees",
  "safety-transparency": "/safety-transparency",
  terms: "/terms",
  privacy: "/privacy",
  refund: "/refund",
};

export function buildPublicStaticMetadata(
  route: PublicStaticRoute,
  rawLocale: string,
): Metadata {
  const locale = getServerLocale(rawLocale);
  const copy = COPY[route][locale];
  return buildSeoMetadata({
    ...copy,
    path: `/${locale}${PATHS[route]}`,
    locale,
  });
}

export function buildPrivateMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}
