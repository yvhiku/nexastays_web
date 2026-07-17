"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { createNexaMapPinIcon } from "@/lib/map-pin";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/Alert";

/** Last resort when geolocation is denied / unavailable. */
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

function readUserLocation(): Promise<{ lat: number; lng: number } | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 },
    );
  });
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
  const userDotRef = useRef<import("leaflet").CircleMarker | null>(null);

  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    latitude != null && longitude != null
      ? { lat: latitude, lng: longitude }
      : null,
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

  // Resolve device location before (or while) creating the map.
  useEffect(() => {
    let cancelled = false;
    setLocating(true);
    void readUserLocation().then((coords) => {
      if (cancelled) return;
      if (coords) setUserCenter(coords);
      setLocating(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (locating) return;
    let cancelled = false;

    async function initMap() {
      if (!mapEl.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      const pinIcon = await createNexaMapPinIcon();
      if (cancelled || !mapEl.current) return;

      const start = pin ?? userCenter ?? FALLBACK;
      const map = L.map(mapEl.current, {
        center: [start.lat, start.lng],
        zoom: pin ? 15 : userCenter ? 14 : 11,
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
      userDotRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locating]);

  // Blue "you are here" dot (not the listing pin).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !userCenter) return;
    let cancelled = false;

    async function syncUserDot() {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;
      if (userDotRef.current) {
        userDotRef.current.setLatLng([userCenter!.lat, userCenter!.lng]);
        return;
      }
      userDotRef.current = L.circleMarker([userCenter!.lat, userCenter!.lng], {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#2563eb",
        fillOpacity: 1,
      })
        .bindTooltip("You are here", { direction: "top", offset: [0, -6] })
        .addTo(mapRef.current);
    }

    void syncUserDot();
    return () => {
      cancelled = true;
    };
  }, [userCenter, ready]);

  useEffect(() => {
    async function syncMarker() {
      const map = mapRef.current;
      if (!map || !pin || !ready) return;
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
  }, [pin, onCoordinatesChange, ready]);

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

  const useMyLocation = async () => {
    setBusy(true);
    setError(null);
    try {
      const coords = userCenter ?? (await readUserLocation());
      if (!coords) {
        setError("Could not get your location. Allow location access and try again.");
        return;
      }
      setUserCenter(coords);
      setPin(coords);
      onCoordinatesChange(coords);
      mapRef.current?.setView([coords.lat, coords.lng], 15, { animate: true });
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

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={findOnMap}
          className="flex-1 border-nexa-primary text-nexa-primary hover:bg-nexa-primary-soft"
        >
          {busy ? "Finding…" : pin ? "Update pin from address" : "Find address on map"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy || locating}
          onClick={() => void useMyLocation()}
          className="sm:w-auto inline-flex items-center gap-1.5"
        >
          <LocateFixed className="h-4 w-4" aria-hidden />
          Use my location
        </Button>
      </div>

      <div className="relative h-[240px] overflow-hidden rounded-xl border border-nexa-line">
        <div ref={mapEl} className="h-full w-full bg-nexa-bg-2" />
        {(locating || !ready) && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-nexa-bg-2/90 text-sm text-nexa-ink-4">
            {locating ? "Finding your location…" : "Loading map…"}
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
          : "No pin yet — find the address, use your location, or tap the map."}
      </p>

      {error && (
        <ErrorAlert error={error} compact onDismiss={() => setError(null)} />
      )}
    </div>
  );
}
