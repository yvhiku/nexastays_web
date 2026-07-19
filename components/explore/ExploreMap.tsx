"use client";

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Heart,
  Home,
  LocateFixed,
  Minus,
  Plus,
  Star,
} from "lucide-react";
import {
  hasMapCoordinates,
  parseNeighborhood,
} from "@/lib/listing-location";
import {
  createPriceBubbleIcon,
  formatListingPriceLabel,
} from "@/lib/map-pin";
import {
  NEXA_EXPLORE_TILE_OPTIONS,
  NEXA_EXPLORE_TILE_URL,
} from "@/lib/explore-map-tiles";
import { matchCuratedNeighborhood } from "@/lib/explore-city-context";
import { getListingMediaUrl } from "@/lib/stays-api";
import { isListingSaved, toggleSavedListing } from "@/lib/saved-listings";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { MapBounds, StaysListing } from "@/lib/stays-types";

const FALLBACK = { lat: 31.6295, lng: -7.9811 };
const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400&q=80";

const GLASS =
  "bg-white/[0.88] backdrop-blur-[12px] border border-nexa-line/80 shadow-sm";

export type ExploreMapHandle = {
  zoomOut: () => void;
  resetView: () => void;
  getBounds: () => MapBounds | null;
};

export interface ExploreMapProps {
  listings: StaysListing[];
  localePath: (path: string) => string;
  checkin?: string;
  checkout?: string;
  guests?: number;
  city?: string;
  preferListingsCenter?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  viewStayLabel?: string;
  exploreThisAreaLabel?: string;
  myLocationLabel?: string;
  resetViewLabel?: string;
  zoomOutLabel?: string;
  currentlyExploringLabel?: string;
  staysWord?: string;
  exploreCityLabel?: string;
  /** Called when user explores (initial, CTA, or programmatic). */
  onBoundsChange?: (bounds: MapBounds) => void;
  onSelectCity?: (city: string) => void;
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

type MarkerClusterGroup = import("leaflet").MarkerClusterGroup;

export const ExploreMap = forwardRef<ExploreMapHandle, ExploreMapProps>(
  function ExploreMap(
    {
      listings,
      localePath,
      checkin,
      checkout,
      guests,
      city = "",
      preferListingsCenter = false,
      emptyTitle = "No stays found here.",
      emptyMessage = "Try zooming out or explore another neighborhood.",
      viewStayLabel = "View Details",
      exploreThisAreaLabel = "Explore this area",
      myLocationLabel = "My location",
      resetViewLabel = "Reset view",
      zoomOutLabel = "Zoom out",
      currentlyExploringLabel = "Currently exploring",
      staysWord = "stays",
      exploreCityLabel,
      onBoundsChange,
      onSelectCity,
    },
    ref,
  ) {
    const router = useRouter();
    const { userId, isAuthenticated } = useAuth();
    const mapEl = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<import("leaflet").Map | null>(null);
    const clusterRef = useRef<MarkerClusterGroup | null>(null);
    const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
    const userMarkerRef = useRef<import("leaflet").CircleMarker | null>(null);
    const didInitialFrame = useRef(false);
    const skipDirtyOnce = useRef(true);
    const staysWordRef = useRef(staysWord);
    staysWordRef.current = staysWord;
    const onBoundsChangeRef = useRef(onBoundsChange);
    onBoundsChangeRef.current = onBoundsChange;

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const [userCenter, setUserCenter] = useState<{
      lat: number;
      lng: number;
    } | null>(null);
    const [locating, setLocating] = useState(true);
    const [saved, setSaved] = useState(false);
    const [coverError, setCoverError] = useState(false);
    const [areaDirty, setAreaDirty] = useState(false);
    const [exploringName, setExploringName] = useState<string | null>(null);
    const [exploringKey, setExploringKey] = useState(0);
    const [previewEnter, setPreviewEnter] = useState(false);

    const mappable = useMemo(
      () => listings.filter(hasMapCoordinates),
      [listings],
    );
    const mappableRef = useRef(mappable);
    mappableRef.current = mappable;
    const cityRef = useRef(city);
    cityRef.current = city;
    const startCenterRef = useRef<{ lat: number; lng: number; zoom: number } | null>(
      null,
    );

    const selected =
      mappable.find((listing) => listing.id === selectedId) ?? null;

    const resolveExploring = useCallback((map: import("leaflet").Map) => {
      const c = cityRef.current;
      if (!c) {
        setExploringName(null);
        return;
      }
      const center = map.getCenter();
      let best: { name: string; d: number } | null = null;
      for (const listing of mappableRef.current) {
        const n = parseNeighborhood(listing);
        if (!n) continue;
        const curated = matchCuratedNeighborhood(c, n);
        if (!curated) continue;
        const d =
          Math.abs(Number(listing.geo_lat) - center.lat) +
          Math.abs(Number(listing.geo_lng) - center.lng);
        if (!best || d < best.d) best = { name: curated.name, d };
      }
      if (best && best.d < 0.08) {
        setExploringName((prev) => {
          if (prev !== best!.name) setExploringKey((k) => k + 1);
          return best!.name;
        });
      } else {
        setExploringName(null);
      }
    }, []);

    const emitBounds = useCallback(() => {
      const map = mapRef.current;
      const cb = onBoundsChangeRef.current;
      if (!map || !cb) return;
      cb(boundsFromMap(map));
      setAreaDirty(false);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        zoomOut: () => {
          mapRef.current?.zoomOut(1);
        },
        resetView: () => {
          const start = startCenterRef.current;
          const map = mapRef.current;
          if (!map) return;
          if (preferListingsCenter && mappable.length > 0) {
            void import("leaflet").then(({ default: L }) => {
              const bounds = L.latLngBounds(
                mappable.map(
                  (l) =>
                    [Number(l.geo_lat), Number(l.geo_lng)] as [number, number],
                ),
              );
              map.fitBounds(bounds.pad(0.18), { maxZoom: 14, animate: true });
            });
            return;
          }
          if (start) {
            map.setView([start.lat, start.lng], start.zoom, { animate: true });
          }
        },
        getBounds: () =>
          mapRef.current ? boundsFromMap(mapRef.current) : null,
      }),
      [mappable, preferListingsCenter],
    );

    useEffect(() => {
      setCoverError(false);
      if (!selected) {
        setSaved(false);
        setPreviewEnter(false);
        return;
      }
      setPreviewEnter(false);
      const id = requestAnimationFrame(() => setPreviewEnter(true));
      setSaved(isListingSaved(selected.id, userId));
      const onChange = () => setSaved(isListingSaved(selected.id, userId));
      window.addEventListener("nexa-saved-listings-changed", onChange);
      return () => {
        cancelAnimationFrame(id);
        window.removeEventListener("nexa-saved-listings-changed", onChange);
      };
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
        const zoom =
          userCenter && !preferListingsCenter
            ? 13
            : mappable.length === 1
              ? 14
              : 11;
        startCenterRef.current = { ...start, zoom };

        const map = L.map(mapEl.current, {
          center: [start.lat, start.lng],
          zoom,
          zoomControl: false,
        });
        L.tileLayer(NEXA_EXPLORE_TILE_URL, {
          ...NEXA_EXPLORE_TILE_OPTIONS,
        }).addTo(map);

        const cluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 16,
          maxClusterRadius: (z: number) => {
            if (z <= 8) return 80;
            if (z <= 11) return 64;
            if (z <= 13) return 48;
            return 36;
          },
          iconCreateFunction: (clusterGroup) => {
            const count = clusterGroup.getChildCount();
            // Sync helper result — createClusterCountIcon is async; use sync divIcon here
            const label = `${count} ${staysWordRef.current}`;
            const width = Math.max(72, Math.min(120, 36 + label.length * 7));
            const height = 34;
            return L.divIcon({
              className: "nexa-cluster",
              html: `<div class="nexa-cluster__body">${label.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div>`,
              iconSize: [width, height],
              iconAnchor: [width / 2, height / 2],
            });
          },
        });
        cluster.addTo(map);

        const onMove = () => {
          if (skipDirtyOnce.current) {
            skipDirtyOnce.current = false;
            resolveExploring(map);
            return;
          }
          setAreaDirty(true);
          resolveExploring(map);
        };

        map.on("moveend", onMove);
        map.on("zoomend", onMove);

        mapRef.current = map;
        clusterRef.current = cluster;
        didInitialFrame.current = true;
        setReady(true);
        setTimeout(() => {
          map.invalidateSize();
          skipDirtyOnce.current = true;
          emitBounds();
          resolveExploring(map);
        }, 50);
      }

      void init();
      return () => {
        cancelled = true;
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
        userMarkerRef.current = L.circleMarker(
          [userCenter!.lat, userCenter!.lng],
          {
            radius: 9,
            color: "#ffffff",
            weight: 3,
            fillColor: "#2563eb",
            fillOpacity: 1,
          },
        )
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
              (l) =>
                [Number(l.geo_lat), Number(l.geo_lng)] as [number, number],
            ),
          );
          skipDirtyOnce.current = true;
          mapRef.current.fitBounds(bounds.pad(0.18), {
            maxZoom: 14,
            animate: true,
          });
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
      skipDirtyOnce.current = true;
      mapRef.current?.setView([coords.lat, coords.lng], 13, { animate: true });
      setAreaDirty(true);
    };

    const resetView = () => {
      const start = startCenterRef.current;
      const map = mapRef.current;
      if (!map) return;
      if (preferListingsCenter && mappable.length > 0) {
        void import("leaflet").then(({ default: L }) => {
          const bounds = L.latLngBounds(
            mappable.map(
              (l) =>
                [Number(l.geo_lat), Number(l.geo_lng)] as [number, number],
            ),
          );
          skipDirtyOnce.current = true;
          map.fitBounds(bounds.pad(0.18), { maxZoom: 14, animate: true });
        });
        return;
      }
      if (start) {
        skipDirtyOnce.current = true;
        map.setView([start.lat, start.lng], start.zoom, { animate: true });
      }
    };

    const coverPhoto = selected?.media?.find((m) => m.kind === "PHOTO");
    const coverSrc =
      coverPhoto && !coverError
        ? getListingMediaUrl(selected!.id, coverPhoto.asset_id)
        : PLACEHOLDER_IMG;
    const rating =
      selected?.avg_rating != null ? Number(selected.avg_rating) : null;
    const reviewCount = selected?.review_count ?? 0;
    const hasWalkthrough = selected?.media?.some(
      (m) => m.kind === "WALKTHROUGH",
    );
    const price = selected?.rate_plan?.base_price;
    const currency = selected?.rate_plan?.currency || "MAD";
    const neighborhood = selected ? parseNeighborhood(selected) : "";
    const detailHref = selected
      ? listingHref(selected, localePath, checkin, checkout, guests)
      : "#";

    return (
      <div
        className={cn(
          "nexa-explore-map relative z-0 isolate overflow-hidden rounded-[20px] sm:rounded-3xl border border-nexa-line shadow-lg",
        )}
      >
        <div className="relative h-[min(72vh,580px)] w-full">
          <div ref={mapEl} className="h-full w-full bg-nexa-bg-2" />
          {(locating || !ready) && (
            <div className="absolute inset-0 z-[400] flex items-center justify-center bg-nexa-bg-2/90 text-sm text-nexa-ink-4">
              {locating ? "Finding your location…" : "Loading map…"}
            </div>
          )}

          {/* Compass */}
          <div
            className={cn(
              "pointer-events-none absolute left-3 top-3 z-[450] flex h-9 w-9 items-center justify-center rounded-full text-[0.7rem] font-bold text-nexa-ink",
              GLASS,
            )}
            aria-hidden
          >
            N
          </div>

          {/* Glass controls */}
          <div className="absolute right-3 top-3 z-[450] flex flex-col items-center gap-2">
            <div className={cn("flex flex-col overflow-hidden rounded-full", GLASS)}>
              <button
                type="button"
                onClick={() => mapRef.current?.zoomIn()}
                className="flex h-9 w-9 items-center justify-center text-nexa-ink hover:bg-white/50"
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </button>
              <div className="h-px w-full bg-nexa-line/60" />
              <button
                type="button"
                onClick={() => mapRef.current?.zoomOut()}
                className="flex h-9 w-9 items-center justify-center text-nexa-ink hover:bg-white/50"
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => void goToUser()}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-nexa-ink hover:text-nexa-primary",
                GLASS,
              )}
              aria-label={myLocationLabel}
              title={myLocationLabel}
            >
              <LocateFixed className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={resetView}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-nexa-ink hover:text-nexa-primary",
                GLASS,
              )}
              aria-label={resetViewLabel}
              title={resetViewLabel}
            >
              <Home className="h-4 w-4" />
            </button>
          </div>

          {/* Explore this area */}
          {areaDirty && (
            <div className="absolute inset-x-0 top-3 z-[460] flex justify-center px-14 pointer-events-none">
              <button
                type="button"
                onClick={() => emitBounds()}
                className={cn(
                  "pointer-events-auto rounded-full px-4 py-2 text-xs font-semibold text-nexa-ink hover:text-nexa-primary transition-colors",
                  GLASS,
                )}
              >
                {exploreThisAreaLabel}
              </button>
            </div>
          )}

          {/* Currently exploring chip */}
          {exploringName && (
            <div className="absolute inset-x-0 top-14 z-[450] flex justify-center px-4 pointer-events-none">
              <div
                key={exploringKey}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs text-nexa-ink animate-[nexaExploreSlide_150ms_ease-out]",
                  GLASS,
                )}
              >
                <span className="text-nexa-ink-4">{currentlyExploringLabel}</span>{" "}
                <span className="font-semibold">{exploringName}</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {ready && mappable.length === 0 && (
            <div className="absolute inset-x-0 top-1/2 z-[450] flex -translate-y-1/2 justify-center px-4">
              <div
                className={cn(
                  "max-w-sm rounded-3xl px-5 py-4 text-center shadow-md",
                  GLASS,
                )}
              >
                <p className="text-sm font-semibold text-nexa-ink">{emptyTitle}</p>
                <p className="mt-1 text-[0.75rem] leading-snug text-nexa-ink-4">
                  {emptyMessage}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => mapRef.current?.zoomOut(1)}
                    className="rounded-full border border-nexa-line bg-white px-3 py-1.5 text-xs font-semibold text-nexa-ink hover:border-nexa-primary"
                  >
                    {zoomOutLabel}
                  </button>
                  {city && onSelectCity && (
                    <button
                      type="button"
                      onClick={() => onSelectCity(city)}
                      className="rounded-full bg-nexa-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-nexa-primary-dark"
                    >
                      {exploreCityLabel || city}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview — Apple Maps style mini travel card */}
        {selected && (
          <div
            className={cn(
              "absolute bottom-4 left-4 right-4 z-[500] mx-auto max-w-md overflow-hidden rounded-3xl border border-nexa-line/80 bg-white/[0.88] p-0 shadow-xl backdrop-blur-[12px] transition-all duration-150 ease-out",
              previewEnter
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0",
            )}
          >
            <Link
              href={detailHref}
              className="relative block h-40 w-full overflow-hidden bg-nexa-bg-2 sm:h-44"
            >
              <Image
                src={coverSrc}
                alt={selected.title}
                fill
                sizes="400px"
                className="object-cover"
                unoptimized={Boolean(coverPhoto) && !coverError}
                onError={() => setCoverError(true)}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedId(null);
                }}
                className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-1 text-xs text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </Link>

            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold leading-snug text-nexa-ink line-clamp-2">
                    {selected.title}
                  </h3>
                  {neighborhood && (
                    <p className="mt-1 text-xs text-nexa-ink-4">
                      {neighborhood}
                      {selected.city ? ` · ${selected.city}` : ""}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className={cn(
                    "shrink-0 rounded-full p-2 transition-colors",
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
                  <Heart
                    className={cn("h-4 w-4", saved && "fill-nexa-primary")}
                  />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-nexa-ink-3">
                <span className="inline-flex items-center gap-1">
                  <Star
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                  <span className="font-semibold tabular-nums text-nexa-ink">
                    {rating != null ? Number(rating).toFixed(1) : "0.0"}
                  </span>
                  <span className="text-nexa-ink-4">
                    ({reviewCount})
                  </span>
                </span>
                {(hasWalkthrough || selected.instant_booking) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-nexa-bg-2 px-2 py-0.5 text-[0.65rem] font-semibold text-nexa-ink">
                    <BadgeCheck className="h-3 w-3 text-green-700" aria-hidden />
                    Verified
                  </span>
                )}
              </div>

              {price != null && (
                <p className="mt-2 text-base font-bold tabular-nums text-nexa-ink">
                  {Math.round(Number(price))} {currency}
                  <span className="font-normal text-nexa-ink-4 text-sm">
                    {" "}
                    / night
                  </span>
                </p>
              )}

              <Link
                href={detailHref}
                className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-nexa-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-nexa-primary-dark"
              >
                {viewStayLabel}
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  },
);
