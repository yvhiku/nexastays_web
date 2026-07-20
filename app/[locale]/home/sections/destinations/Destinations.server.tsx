import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { getServerTranslations } from "@/lib/i18n/server";
import { DESTINATION_IMAGES, DESTINATION_IMAGE_BLUR } from "@/lib/destination-assets";
import { Button } from "@/components/ui/button";

const destinations = [
  {
    img: DESTINATION_IMAGES.marrakech,
    city: "Marrakech",
    titleKey: "home.destinations.marrakech",
    subtitleKey: "home.destinations.marrakechSub",
    span: 2,
    priority: true,
  },
  {
    img: DESTINATION_IMAGES.agadir,
    city: "Agadir",
    titleKey: "home.destinations.agadir",
    subtitleKey: "home.destinations.agadirSub",
    span: 1,
    priority: false,
  },
  {
    img: DESTINATION_IMAGES.tangier,
    city: "Tangier",
    titleKey: "home.destinations.tangier",
    subtitleKey: "home.destinations.tangierSub",
    span: 1,
    priority: false,
  },
  {
    img: DESTINATION_IMAGES.casablanca,
    city: "Casablanca",
    titleKey: "home.destinations.casablanca",
    subtitleKey: "home.destinations.casablancaSub",
    span: 1,
    priority: false,
  },
  {
    img: DESTINATION_IMAGES.fes,
    city: "Fes",
    titleKey: "home.destinations.fes",
    subtitleKey: "home.destinations.fesSub",
    span: 1,
    priority: false,
  },
] as const;

type Props = {
  locale: Locale;
};

export function DestinationsSection({ locale }: Props) {
  const { t, localePath } = getServerTranslations(locale);

  return (
    <section className="py-16 sm:py-20 md:py-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="text-center mb-9">
          <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-nexa-primary mb-3">
            {t("home.destinations.eyebrow")}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-nexa-ink">
            {t("home.destinations.title")}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {destinations.map((dest) => (
            <div
              key={dest.titleKey}
              className={`rounded-[22px] overflow-hidden relative cursor-pointer hover:scale-[1.02] transition-transform ${
                dest.span === 2 ? "sm:row-span-2 sm:min-h-[440px]" : ""
              }`}
            >
              <Link href={localePath(`/listings?city=${encodeURIComponent(dest.city)}`)}>
                <div className="relative h-[220px] min-h-[220px] sm:h-full">
                  <Image
                    src={dest.img}
                    alt={t(dest.titleKey)}
                    fill
                    priority={dest.priority}
                    placeholder="blur"
                    blurDataURL={DESTINATION_IMAGE_BLUR}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-nexa-ink/65 to-transparent" />
                  <div className="absolute bottom-5 left-5">
                    <h3 className="font-display text-xl font-semibold text-white">
                      {t(dest.titleKey)}
                    </h3>
                    <p className="text-sm text-white/75 mt-0.5">{t(dest.subtitleKey)}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Button variant="outline" size="lg" asChild>
            <Link href={localePath("/listings")}>{t("home.destinations.exploreAll")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
