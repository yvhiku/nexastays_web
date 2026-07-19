import type { SearchBarValue } from "./types";
import { occupancyTotal } from "./search-url";


/** Format closed-field guest summary per freeze rules. */
export function formatGuestSummary(
  value: Pick<SearchBarValue, "adults" | "children" | "infants" | "pets">,
  tf: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const adults = value.adults;
  const children = value.children;
  const infants = value.infants;
  const pets = value.pets;
  const total = occupancyTotal(value);

  if (total <= 0 && infants <= 0 && pets <= 0) {
    return tf("searchBar.addGuests");
  }

  const parts: string[] = [];

  if (children === 0 && infants === 0 && pets === 0) {
    parts.push(
      total === 1
        ? tf("searchBar.guestSingular", { count: total })
        : tf("searchBar.guestPlural", { count: total }),
    );
  } else if (children > 0 || adults > 0) {
    if (adults > 0) {
      parts.push(
        adults === 1
          ? tf("searchBar.adultSingular", { count: adults })
          : tf("searchBar.adultPlural", { count: adults }),
      );
    }
    if (children > 0) {
      parts.push(
        children === 1
          ? tf("searchBar.childSingular", { count: children })
          : tf("searchBar.childPlural", { count: children }),
      );
    }
  }

  if (infants > 0) {
    parts.push(
      infants === 1
        ? tf("searchBar.infantSingular", { count: infants })
        : tf("searchBar.infantPlural", { count: infants }),
    );
  }
  if (pets > 0) {
    parts.push(
      pets === 1
        ? tf("searchBar.petSingular")
        : tf("searchBar.petPlural", { count: pets }),
    );
  }

  return parts.join(" · ") || tf("searchBar.addGuests");
}

export function formatDateRangeSummary(
  checkin: string,
  checkout: string,
  locale: string,
  emptyLabel: string,
): string {
  if (!checkin && !checkout) return emptyLabel;
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return iso;
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    }).format(new Date(y, m - 1, d));
  };
  if (checkin && checkout) return `${fmt(checkin)} — ${fmt(checkout)}`;
  if (checkin) return fmt(checkin);
  return emptyLabel;
}
