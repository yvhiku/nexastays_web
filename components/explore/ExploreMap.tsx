"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { hasMapCoordinates } from "@/lib/listing-location";
import {
  createPriceBubbleIcon,
  formatListingPriceLabel,
} from "@/lib/map-pin";
import type { StaysListing } from "@/lib/stays-types";

const FALLBACK = { lat: 31.6295, lng: -7.9811 };

export interface ExploreMapProps {
  listings: StaysListing[];
  localePath: (path: string) => string;
  checkin?: string;
  checkout?: string;
  guests?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  viewStayLabel?: string;
}

function listingHref(
  listing: StaysListing,
  localePath: (path: string) => string,
  checkin?: string,
  checkout?: string,
  guests?: number,
) {
  const params = new URLSearchParams();
  if (checkin) params.set("checkin_date", checkin);
  if (checkout) params.set("checkout_date", checkout);
  if (guests) params.set("guests", String(guests));
  const qs = params.toString();
  return localePath(`/listings/${listing.id}${qs ? `?${qs}` : ""}`);
}

export function ExploreMap({
  listings,
  localePath,
  checkin,
  checkout,
  guests,
  emptyTitle = "No stays to map yet",
  emptyMessage = "These results do not have map coordinates.",
  viewStayLabel = "View stay",
}: ExploreMapProps) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const mappable = useMemo(
    () => listings.filter(hasMapCoordinates),
    [listings],
  );
  const selected = mappable.find((listing) => listing.id === selectedId) ?? null;

  const center = useMemo(() => {
    if (mappable.length === 0) return FALLBACK;
    const lat =
      mappable.reduce((sum, listing) => sum + Number(listing.geo_lat), 0) /
      mappable.length;
    const lng =
      mappable.reduce((sum, listing) => sum + Number(listing.geo_lng), 0) /
      mappable.length;
    return { lat, lng };
  }, [mappable]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapEl.current || mapRef.current || mappable.length === 0) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current) return;

      const map = L.map(mapEl.current, {
        center: [center.lat, center.lng],
        zoom: mappable.length === 1 ? 14 : 11,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      markersRef.current.clear();
      for (const listing of mappable) {
        const label = formatListingPriceLabel(listing);
        const icon = await createPriceBubbleIcon(label, false);
        if (cancelled) return;
        const marker = L.marker(
          [Number(listing.geo_lat), Number(listing.geo_lng)],
          { icon, riseOnHover: true },
        ).addTo(map);
        marker.on("click", () => setSelectedId(listing.id));
        markersRef.current.set(listing.id, marker);
      }

      mapRef.current = map;
      setReady(true);
      setTimeout(() => map.invalidateSize(), 50);
    }

    void init();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [center.lat, center.lng, mappable]);

  useEffect(() => {
    async function syncSelection() {
      for (const listing of mappable) {
        const marker = markersRef.current.get(listing.id);
        if (!marker) continue;
        const label = formatListingPriceLabel(listing);
        const icon = await createPriceBubbleIcon(
          label,
          listing.id === selectedId,
        );
        marker.setIcon(icon);
        if (listing.id === selectedId) marker.setZIndexOffset(1000);
        else marker.setZIndexOffset(0);
      }
    }
    void syncSelection();
  }, [selectedId, mappable]);

  if (mappable.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-nexa-line bg-white px-6 text-center">
        <MapPin className="mb-3 h-10 w-10 text-nexa-ink-4" aria-hidden />
        <p className="text-base font-semibold text-nexa-ink">{emptyTitle}</p>
        <p className="mt-1 max-w-sm text-sm text-nexa-ink-4">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-nexa-line">
      <div className="relative h-[min(70vh,560px)] w-full">
        <div ref={mapEl} className="h-full w-full" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-nexa-bg-2 text-sm text-nexa-ink-4">
            Loading map…
          </div>
        )}
      </div>

      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-[500] mx-auto max-w-md rounded-2xl border border-nexa-line bg-white p-4 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-nexa-ink">
                {selected.title}
              </p>
              <p className="mt-0.5 text-xs text-nexa-ink-4">
                {selected.neighborhood
                  ? `${selected.neighborhood} · ${selected.city}`
                  : selected.city}
              </p>
              {selected.rate_plan?.base_price != null && (
                <p className="mt-2 text-sm font-bold text-nexa-primary">
                  {Math.round(Number(selected.rate_plan.base_price))}{" "}
                  {selected.rate_plan.currency || "MAD"}
                  <span className="font-normal text-nexa-ink-4"> / night</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-nexa-ink-4 hover:bg-nexa-bg-2"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <Link
            href={listingHref(selected, localePath, checkin, checkout, guests)}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-nexa-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-nexa-primary-dark"
          >
            {viewStayLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
