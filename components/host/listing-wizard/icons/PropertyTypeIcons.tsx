import type { SVGProps, ReactElement } from "react";
import type { ListingType } from "@/lib/host-listing-wizard/form-types";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function ApartmentIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
      <path d="M14 10h5a1 1 0 0 1 1 1v10" />
      <path d="M8 8h2M8 12h2M8 16h2M17 14h1M17 17h1" />
    </svg>
  );
}

export function VillaIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 21h18" />
      <path d="M5 21V10l7-5 7 5v11" />
      <path d="M10 21v-5h4v5" />
      <path d="M9 13h1M14 13h1" />
    </svg>
  );
}

export function RiadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 21V8l8-4 8 4v13" />
      <path d="M9 21v-6h6v6" />
      <path d="M12 8v3" />
      <circle cx="12" cy="13" r="1.2" />
    </svg>
  );
}

export function HotelIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 21V4h10v17" />
      <path d="M14 10h6v11" />
      <path d="M7 8h2M7 12h2M7 16h2M17 14h1M17 17h1" />
      <path d="M9 21v-3h2v3" />
    </svg>
  );
}

export function HostelIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 18h18" />
      <path d="M5 18V8h14v10" />
      <path d="M5 12h14" />
      <path d="M8 12v3M12 12v3M16 12v3" />
      <path d="M8 8V6M16 8V6" />
    </svg>
  );
}

export const PROPERTY_TYPE_ICONS: Record<
  ListingType,
  (props: IconProps) => ReactElement
> = {
  APARTMENT: ApartmentIcon,
  VILLA: VillaIcon,
  RIAD: RiadIcon,
  HOTEL: HotelIcon,
  HOSTEL: HostelIcon,
};
