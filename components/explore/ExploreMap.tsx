"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Heart,
  LocateFixed,
  MapPin,
  Star,
} from "lucide-react";
import { hasMapCoordinates } from "@/lib/listing-location";
import {
  createPriceBubbleIcon,
  formatListingPriceLabel,
} from "@/lib/map-pin";
import { getListingMediaUrl } from "@/lib/stays-api";
import { isListingSaved, toggleSavedListing } from "@/lib/saved-listings";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { MapBounds, StaysListing } from "@/lib/stays-types";

/** Last-resort center when geolocation is denied / unavailable. */
const FALLBACK = { lat: 31.6295, lng: -7.9811 };
const BOUNDS_DEBOUNCE_MS = 350;
const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80";

export interface ExploreMapProps {
  listings: StaysListing[];
  localePath: (path: string) => string;
  checkin?: string;
  checkout?: string;
  guests?: number;
  /** When true (e.g. city filter), frame the map around listing pins instead of the user. */
  preferListingsCenter?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  viewStayLabel?: string;
  /** Debounced viewport bounds → parent refetches /explore/map */
  onBoundsChange?: (bounds: MapBounds) => void;
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

function averageCenter(listings: StaysListing[]): { lat: number; lng: number } {
  const lat =
    listings.reduce((sum, listing) => sum + Number(listing.geo_lat), 0) /
    listings.length;
  const lng =
    listings.reduce((sum, listing) => sum + Number(listing.geo_lng), 0) /
    listings.length;
  return { lat, lng };
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
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  });
}

function boundsFromMap(map: import("leaflet").Map): MapBounds {
  const b = map.getBounds();
  return {
    north: b.getNorth(),
    south: b.getSouth(),
    east: b.getEast(),
    west: b.getWest(),
  };
}

function bedroomCount(listing: StaysListing): number | null {
  const pd = listing.property_details;
  if (!pd) return null;
  if (typeof pd.bedroom_count === "number") return pd.bedroom_count;
  if (Array.isArray(pd.bedrooms) && pd.bedrooms.length > 0) {
    return pd.bedrooms.length;
  }
  if (typeof pd.bedrooms === "number") return pd.bedrooms;
  return null;
}

function mapMetaLine(listing: StaysListing): string {
  const parts: string[] = [];
  const beds = bedroomCount(listing);
  if (beds != null && beds > 0) {
    parts.push(`${beds} Bedroom${beds === 1 ? "" : "s"}`);
  }
  const maxGuests = listing.rules?.max_guests;
  if (maxGuests != null && maxGuests > 0) {
    parts.push(`${maxGuests} Guest${maxGuests === 1 ? "" : "s"}`);
  }
  const amenities = (listing.rules?.amenities ?? []).map((a) =>
    String(a).toLowerCase(),
  );
  if (amenities.some((a) => a.includes("wifi") || a.includes("wi-fi"))) {
    parts.push("WiFi");
  }
  return parts.join(" · ");
}

type MarkerClusterGroup = import("leaflet").MarkerClusterGroup;

export function ExploreMap({
  listings,
  localePath,
  checkin,
  checkout,
  guests,
  preferListingsCenter = false,
  emptyTitle = "No stays nearby on the map yet",
  emptyMessage = "Move the map or clear filters to explore other areas.",
  viewStayLabel = "View Details",
  onBoundsChange,
}: ExploreMapProps) {
  const router = useRouter();
  const { userId, isAuthenticated } = useAuth();
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const clusterRef = useRef<MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const userMarkerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const didInitialFrame = useRef(false);
  const boundsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(true);
  const [saved, setSaved] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const mappable = useMemo(
    () => listings.filter(hasMapCoordinates),
    [listings],
  );
  const selected = mappable.find((listing) => listing.id === selectedId) ?? null;

  useEffect(() => {
    setCoverError(false);
    if (!selected) {
      setSaved(false);
      return;
    }
    setSaved(isListingSaved(selected.id, userId));
    const onChange = () => setSaved(isListingSaved(selected.id, userId));
    window.addEventListener("nexa-saved-listings-changed", onChange);
    return () => window.removeEventListener("nexa-saved-listings-changed", onChange);
  }, [selected?.id, userId]);

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

    async function init() {
      if (!mapEl.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");
      if (cancelled || !mapEl.current) return;

      const start =
        !preferListingsCenter && userCenter
          ? userCenter
          : mappable.length > 0
            ? averageCenter(mappable)
            : userCenter ?? FALLBACK;

      const map = L.map(mapEl.current, {
        center: [start.lat, start.lng],
        zoom: userCenter && !preferListingsCenter ? 13 : mappable.length === 1 ? 14 : 11,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 16,
        maxClusterRadius: (zoom: number) => {
          if (zoom <= 8) return 80;
          if (zoom <= 11) return 64;
          if (zoom <= 13) return 48;
          return 36;
        },
        iconCreateFunction: (clusterGroup) => {
          const count = clusterGroup.getChildCount();
          const size = count < 10 ? 42 : count < 50 ? 50 : 58;
          return L.divIcon({
            className: "nexa-cluster",
            html: `<div class="nexa-cluster__body">${count}</div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
        },
      });
      cluster.addTo(map);

      const emitBounds = () => {
        if (boundsTimer.current) clearTimeout(boundsTimer.current);
        boundsTimer.current = setTimeout(() => {
          const cb = onBoundsChangeRef.current;
          if (!cb || !mapRef.current) return;
          cb(boundsFromMap(mapRef.current));
        }, BOUNDS_DEBOUNCE_MS);
      };

      map.on("moveend", emitBounds);
      map.on("zoomend", emitBounds);

      mapRef.current = map;
      clusterRef.current = cluster;
      didInitialFrame.current = true;
      setReady(true);
      setTimeout(() => {
        map.invalidateSize();
        emitBounds();
      }, 50);
    }

    void init();
    return () => {
      cancelled = true;
      if (boundsTimer.current) clearTimeout(boundsTimer.current);
      clusterRef.current?.clearLayers();
      clusterRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
      userMarkerRef.current = null;
      didInitialFrame.current = false;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locating, preferListingsCenter]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userCenter || !ready) return;
    let cancelled = false;

    async function syncUserMarker() {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userCenter!.lat, userCenter!.lng]);
        return;
      }
      userMarkerRef.current = L.circleMarker([userCenter!.lat, userCenter!.lng], {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: "#2563eb",
        fillOpacity: 1,
      })
        .bindTooltip("You are here", { direction: "top", offset: [0, -8] })
        .addTo(mapRef.current);
    }

    void syncUserMarker();
    return () => {
      cancelled = true;
    };
  }, [userCenter, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster || !ready) return;
    let cancelled = false;

    async function syncMarkers() {
      const L = (await import("leaflet")).default;
      if (cancelled || !clusterRef.current) return;

      const keep = new Set(mappable.map((l) => l.id));
      for (const [id, marker] of markersRef.current) {
        if (!keep.has(id)) {
          clusterRef.current.removeLayer(marker);
          markersRef.current.delete(id);
        }
      }

      for (const listing of mappable) {
        const lat = Number(listing.geo_lat);
        const lng = Number(listing.geo_lng);
        const label = formatListingPriceLabel(listing);
        const isSelected = listing.id === selectedId;
        const icon = await createPriceBubbleIcon(label, isSelected);
        if (cancelled || !clusterRef.current) return;

        const existing = markersRef.current.get(listing.id);
        if (existing) {
          existing.setLatLng([lat, lng]);
          existing.setIcon(icon);
          existing.setZIndexOffset(isSelected ? 1000 : 0);
          continue;
        }

        const marker = L.marker([lat, lng], { icon, riseOnHover: true });
        marker.on("click", () => setSelectedId(listing.id));
        clusterRef.current.addLayer(marker);
        markersRef.current.set(listing.id, marker);
      }

      if (
        preferListingsCenter &&
        mappable.length > 0 &&
        didInitialFrame.current &&
        mapRef.current
      ) {
        const bounds = L.latLngBounds(
          mappable.map(
            (l) => [Number(l.geo_lat), Number(l.geo_lng)] as [number, number],
          ),
        );
        mapRef.current.fitBounds(bounds.pad(0.18), { maxZoom: 14, animate: true });
        didInitialFrame.current = false;
      }
    }

    void syncMarkers();
    return () => {
      cancelled = true;
    };
  }, [mappable, ready, selectedId, preferListingsCenter]);

  const goToUser = async () => {
    const coords = userCenter ?? (await readUserLocation());
    if (!coords) return;
    setUserCenter(coords);
    mapRef.current?.setView([coords.lat, coords.lng], 13, { animate: true });
  };

  const coverPhoto = selected?.media?.find((m) => m.kind === "PHOTO");
  const coverSrc =
    coverPhoto && !coverError
      ? getListingMediaUrl(selected!.id, coverPhoto.asset_id)
      : PLACEHOLDER_IMG;
  const metaLine = selected ? mapMetaLine(selected) : "";
  const rating = selected?.avg_rating != null ? Number(selected.avg_rating) : null;
  const reviewCount = selected?.review_count ?? 0;
  const hasWalkthrough = selected?.media?.some((m) => m.kind === "WALKTHROUGH");
  const price = selected?.rate_plan?.base_price;
  const currency = selected?.rate_plan?.currency || "MAD";
  const detailHref = selected
    ? listingHref(selected, localePath, checkin, checkout, guests)
    : "#";

  return (
    <div className="relative z-0 isolate overflow-hidden rounded-2xl border border-nexa-line">
      <div className="relative h-[min(70vh,560px)] w-full">
        <div ref={mapEl} className="h-full w-full bg-nexa-bg-2" />
        {(locating || !ready) && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-nexa-bg-2/90 text-sm text-nexa-ink-4">
            {locating ? "Finding your location…" : "Loading map…"}
          </div>
        )}

        <button
          type="button"
          onClick={() => void goToUser()}
          className="absolute right-3 top-3 z-[450] inline-flex items-center gap-1.5 rounded-xl border border-nexa-line bg-white px-3 py-2 text-xs font-semibold text-nexa-ink shadow-sm hover:border-nexa-primary/40 hover:text-nexa-primary"
          aria-label="Center on my location"
        >
          <LocateFixed className="h-3.5 w-3.5" aria-hidden />
          Near me
        </button>

        {ready && mappable.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-14 z-[450] flex justify-center px-4">
            <div className="flex max-w-sm items-start gap-2 rounded-xl border border-nexa-line bg-white/95 px-3 py-2.5 text-left shadow-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-nexa-ink-4" aria-hidden />
              <div>
                <p className="text-xs font-semibold text-nexa-ink">{emptyTitle}</p>
                <p className="mt-0.5 text-[0.7rem] leading-snug text-nexa-ink-4">
                  {emptyMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="absolute bottom-4 left-4 right-4 z-[500] mx-auto max-w-lg rounded-2xl border border-nexa-line bg-white p-3 shadow-xl sm:p-3.5">
          <div className="flex gap-3">
            <Link
              href={detailHref}
              className="relative h-[118px] w-[118px] shrink-0 overflow-hidden rounded-xl bg-nexa-bg-2 sm:h-[128px] sm:w-[132px]"
            >
              <Image
                src={coverSrc}
                alt={selected.title}
                fill
                sizes="132px"
                className="object-cover"
                unoptimized={Boolean(coverPhoto) && !coverError}
                onError={() => setCoverError(true)}
              />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start gap-2">
                <Link href={detailHref} className="min-w-0 flex-1">
                  <h3 className="truncate text-[0.95rem] font-semibold leading-snug text-nexa-ink">
                    {selected.title}
                  </h3>
                </Link>
                <button
                  type="button"
                  className={cn(
                    "shrink-0 rounded-full p-1.5 transition-colors",
                    saved
                      ? "text-nexa-primary"
                      : "text-nexa-ink-4 hover:text-nexa-primary",
                  )}
                  aria-label="Save stay"
                  aria-pressed={saved}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isAuthenticated || !userId) {
                      const returnTo =
                        typeof window !== "undefined"
                          ? `${window.location.pathname}${window.location.search}`
                          : detailHref;
                      router.push(
                        `${localePath("/login")}?redirect=${encodeURIComponent(returnTo)}`,
                      );
                      return;
                    }
                    setSaved(toggleSavedListing(selected.id, userId));
                  }}
                >
                  <Heart className={cn("h-4 w-4", saved && "fill-nexa-primary")} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="shrink-0 rounded-lg px-1.5 py-1 text-xs text-nexa-ink-4 hover:bg-nexa-bg-2"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {rating != null ? (
                <div className="mt-1">
                  <p className="flex items-center gap-1 text-[0.72rem] text-nexa-ink-3">
                    <Star
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      aria-hidden
                    />
                    <span className="font-semibold tabular-nums text-nexa-ink">
                      {Number(rating).toFixed(1)}
                    </span>
                  </p>
                  <p className="text-[0.65rem] text-nexa-ink-4 tabular-nums">
                    {reviewCount} review{reviewCount === 1 ? "" : "s"}
                  </p>
                </div>
              ) : (
                <div className="mt-1">
                  <p className="flex items-center gap-1 text-[0.72rem] text-nexa-ink-3">
                    <Star
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      aria-hidden
                    />
                    <span className="font-semibold tabular-nums text-nexa-ink">
                      0.0
                    </span>
                  </p>
                  <p className="text-[0.65rem] text-nexa-ink-4 tabular-nums">
                    0 reviews
                  </p>
                </div>
              )}

              {metaLine ? (
                <p className="mt-1 truncate text-[0.72rem] text-nexa-ink-4">
                  {metaLine}
                </p>
              ) : null}

              <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                {price != null ? (
                  <p className="min-w-0 text-sm font-bold tabular-nums text-nexa-primary">
                    {Math.round(Number(price))} {currency}
                    <span className="font-normal text-nexa-ink-4"> / night</span>
                  </p>
                ) : (
                  <span />
                )}
                {(hasWalkthrough || selected.instant_booking) && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-nexa-bg-2 px-2 py-0.5 text-[0.65rem] font-semibold text-nexa-ink">
                    <BadgeCheck className="h-3 w-3 text-green-700" aria-hidden />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link
            href={detailHref}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-nexa-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-nexa-primary-dark"
          >
            {viewStayLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
