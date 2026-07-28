"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SemanticBreadcrumb } from "@/lib/seo/entity-graph";

type Props = {
  items: SemanticBreadcrumb[];
  tone?: "light" | "dark";
  className?: string;
};

export function SemanticBreadcrumbs({
  items,
  tone = "dark",
  className = "",
}: Props) {
  const { localePath } = useLanguage();
  const textClass = tone === "light" ? "text-white/80" : "text-nexa-muted";
  const activeClass = tone === "light" ? "text-white" : "text-nexa-ink";
  const hoverClass = tone === "light" ? "hover:text-white" : "hover:text-nexa-primary";

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-x-1 gap-y-1 text-xs ${textClass} ${className}`}
    >
      <ol className="contents">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.path}:${index}`} className="inline-flex min-w-0 items-center gap-1">
              {index > 0 && <span aria-hidden="true">/</span>}
              {current ? (
                <span aria-current="page" className={`max-w-[18rem] truncate ${activeClass}`}>
                  {item.name}
                </span>
              ) : (
                <Link
                  href={localePath(item.path.replace(/^\/(en|fr|ar)/, "") || "/")}
                  className={`rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary ${hoverClass}`}
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

