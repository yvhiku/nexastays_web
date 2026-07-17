"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createNexaMapPinIcon } from "@/lib/map-pin";
import { Button } from "@/components/ui/button";

const FALLBACK = { lat: 31.6295, lng: -7.9811 };

export interface HostLocationMapPickerProps {
  city: string;
  neighborhood?: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  onCoordinatesChange: (coords: { lat: number; lng: number }) => void;
}

async function geocodeWithNominatim(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const osmUrl =
    `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "ma",
    }).toString();
  const osmResponse = await fetch(osmUrl, {
    headers: { Accept: "application/json" },
  });
  if (!osmResponse.ok) return null;
  const results = (await osmResponse.json()) as Array<{ lat: string; lon: string }>;
  if (!results.length) return null;
  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
  };
}

export function HostLocationMapPicker({
  city,
  neighborhood = "",
  address,
  latitude,
  longitude,
  onCoordinatesChange,
}: HostLocationMapPickerProps) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null,
  );

  const query = useMemo(
    () =>
      [address, neighborhood, city, "Morocco"]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(", "),
    [address, neighborhood, city],
  );

  useEffect(() => {
    if (latitude != null && longitude != null) {
      setPin({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapEl.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      const pinIcon = await createNexaMapPinIcon();
      if (cancelled || !mapEl.current) return;

      const start = pin ?? FALLBACK;
      const map = L.map(mapEl.current, {
        center: [start.lat, start.lng],
        zoom: pin ? 15 : 11,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (event) => {
        const next = { lat: event.latlng.lat, lng: event.latlng.lng };
        setPin(next);
        setError(null);
        onCoordinatesChange(next);
      });

      mapRef.current = map;
      (map as unknown as { __nexaPinIcon?: typeof pinIcon }).__nexaPinIcon =
        pinIcon;
      setReady(true);
      setTimeout(() => map.invalidateSize(), 50);
    }

    void initMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function syncMarker() {
      const map = mapRef.current;
      if (!map || !pin) return;
      const L = (await import("leaflet")).default;
      const pinIcon =
        (map as unknown as { __nexaPinIcon?: import("leaflet").Icon })
          .__nexaPinIcon ?? (await createNexaMapPinIcon());
      if (!markerRef.current) {
        markerRef.current = L.marker([pin.lat, pin.lng], {
          draggable: true,
          icon: pinIcon,
        }).addTo(map);
        markerRef.current.on("dragend", () => {
          const position = markerRef.current?.getLatLng();
          if (!position) return;
          const next = { lat: position.lat, lng: position.lng };
          setPin(next);
          setError(null);
          onCoordinatesChange(next);
        });
      } else {
        markerRef.current.setIcon(pinIcon);
        markerRef.current.setLatLng([pin.lat, pin.lng]);
      }
      map.setView([pin.lat, pin.lng], Math.max(map.getZoom(), 15));
    }
    void syncMarker();
  }, [pin, onCoordinatesChange]);

  const findOnMap = async () => {
    if (!query.replace(/[,\s]/g, "")) {
      setError("Enter city and address first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await geocodeWithNominatim(query);
      if (!result) {
        setError("Could not find that address. Try a clearer street or city.");
        return;
      }
      setPin(result);
      onCoordinatesChange(result);
    } catch {
      setError("Could not place address on map. Check the address and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-nexa-ink">Map location *</p>
        <p className="mt-1 text-xs text-nexa-ink-4">
          Guests see this pin on Explore map. Drag the marker or tap the map to fine-tune.
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={findOnMap}
        className="w-full border-nexa-primary text-nexa-primary hover:bg-nexa-primary-soft"
      >
        {busy ? "Finding…" : pin ? "Update pin from address" : "Find address on map"}
      </Button>

      <div className="relative h-[240px] overflow-hidden rounded-xl border border-nexa-line">
        <div ref={mapEl} className="h-full w-full" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-nexa-bg-2 text-sm text-nexa-ink-4">
            Loading map…
          </div>
        )}
      </div>

      <p
        className={`text-xs font-medium ${
          pin ? "text-emerald-700" : "text-nexa-ink-4"
        }`}
      >
        {pin
          ? `Pinned · ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`
          : "No pin yet — find the address or tap the map."}
      </p>

      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
