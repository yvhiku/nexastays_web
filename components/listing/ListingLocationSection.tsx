"use client";

import React from "react";
import { MapPin, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListingDetailMap } from "@/components/listing/ListingDetailMap";
import type { StaysListing } from "@/lib/stays-types";
import {
  getFullMapsSearchQuery,
  getListingLocationText,
  getMapsSearchUrl,
  hasListingLocationInfo,
  hasMapCoordinates,
} from "@/lib/listing-location";

export interface ListingLocationSectionProps {
  listing: StaysListing;
  title: string;
  openInMapsLabel: string;
  contactNote: string;
}

export function ListingLocationSection({
  listing,
  title,
  openInMapsLabel,
  contactNote,
}: ListingLocationSectionProps) {
  if (!hasListingLocationInfo(listing)) return null;

  const locationText = getListingLocationText(listing);
  const mapsSearchUrl = getMapsSearchUrl(listing);
  const showMap =
    hasMapCoordinates(listing) || Boolean(getFullMapsSearchQuery(listing));

  return (
    <section>
      <h2 className="font-display text-2xl font-semibold mb-4">{title}</h2>
      <div className="flex items-start gap-3 mb-4">
        <MapPin className="w-5 h-5 text-nexa-primary shrink-0 mt-0.5" />
        <p className="text-base font-medium text-nexa-ink leading-relaxed">{locationText}</p>
      </div>

      {showMap && (
        <div className="rounded-2xl overflow-hidden border border-nexa-line/40 mb-4">
          <ListingDetailMap
            geoLat={listing.geo_lat}
            geoLng={listing.geo_lng}
            searchQuery={getFullMapsSearchQuery(listing)}
          />
        </div>
      )}

      {mapsSearchUrl && (
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto rounded-full border-nexa-primary text-nexa-primary hover:bg-nexa-primary/5"
          onClick={() => window.open(mapsSearchUrl, "_blank", "noopener,noreferrer")}
        >
          <Map className="w-4 h-4 mr-2" />
          {openInMapsLabel}
        </Button>
      )}

      <p className="mt-4 text-sm text-nexa-ink-4 leading-relaxed">{contactNote}</p>
    </section>
  );
}
