"use client";

import React, { useEffect, useRef, useState } from "react";
import { Map as MapIcon } from "lucide-react";
import { createNexaMapPinIcon } from "@/lib/map-pin";
import { hasMapCoordinates } from "@/lib/listing-location";

export interface ListingDetailMapProps {
  geoLat?: number | null;
  geoLng?: number | null;
  /** Used to approximate the pin when coordinates are missing. */
  searchQuery?: string | null;
  className?: string;
  heightClassName?: string;
}

async function geocodeQuery(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "ma",
    }).toString();
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  const results = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (!results.length) return null;
  return { lat: Number(results[0].lat), lng: Number(results[0].lon) };
}

export function ListingDetailMap({
  geoLat,
  geoLng,
  searchQuery,
  className = "",
  heightClassName = "h-[180px] md:h-[220px]",
}: ListingDetailMapProps) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const hasCoords = hasMapCoordinates({ geo_lat: geoLat, geo_lng: geoLng });
  const query = (searchQuery || "").trim();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!mapEl.current || mapRef.current) return;

      let center = hasCoords
        ? { lat: Number(geoLat), lng: Number(geoLng) }
        : null;

      if (!center && query) {
        center = await geocodeQuery(query);
      }
      if (cancelled) return;
      if (!center) {
        setFailed(true);
        return;
      }

      const L = (await import("leaflet")).default;
      const pinIcon = await createNexaMapPinIcon();
      if (cancelled || !mapEl.current) return;

      const map = L.map(mapEl.current, {
        center: [center.lat, center.lng],
        zoom: hasCoords ? 15 : 13,
        scrollWheelZoom: false,
        dragging: true,
        attributionControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.marker([center.lat, center.lng], { icon: pinIcon }).addTo(map);

      mapRef.current = map;
      setReady(true);
      setTimeout(() => map.invalidateSize(), 50);
    }

    void init().catch(() => {
      if (!cancelled) setFailed(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [geoLat, geoLng, hasCoords, query]);

  if (failed && !hasCoords && !query) {
    return (
      <div
        className={`flex w-full items-center justify-center bg-nexa-bg-2 ${heightClassName} ${className}`}
      >
        <MapIcon className="h-10 w-10 text-nexa-ink-4" />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-nexa-bg-2 ${heightClassName} ${className}`}
    >
      <div ref={mapEl} className="h-full w-full" />
      {!ready && !failed && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-nexa-ink-4">
          Loading map…
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <MapIcon className="h-10 w-10 text-nexa-ink-4" />
        </div>
      )}
    </div>
  );
}
