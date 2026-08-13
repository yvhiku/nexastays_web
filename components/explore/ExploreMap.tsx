"use client";

import { matchCuratedNeighborhood } from "@/lib/explore-city-context";
import { cn } from "@/lib/utils";
import type { MapBounds, StaysListing } from "@/lib/stays-types";
import { ExploreMapListingPreview } from "@/components/explore/ExploreMapListingPreview";
import { ExploreMapAttribution } from "@/components/explore/ExploreMapAttribution";
import {
  createPriceBubbleIcon,
  formatListingPriceLabel,
} from "@/lib/map-pin";
import {
  NEXA_EXPLORE_TILE_OPTIONS,
  NEXA_EXPLORE_TILE_URL,
} from "@/lib/explore-map-tiles";
import {
  hasMapCoordinates,
  parseNeighborhood,
} from "@/lib/listing-location";
import {
  Home,
  LocateFixed,
  Minus,
  Plus,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";

const FALLBACK = { lat: 31.6295, lng: -7.9811 };
const BOUNDS_DEBOUNCE_MS = 350;

/** Warm-white map chrome — no glass blur. */
const MAP_CONTROL =
  "bg-white border border-nexa-line/80 shadow-[0_2px_10px_rgba(26,10,15,0.08)]";
const MAP_CONTROL_BTN =
  "flex h-11 w-11 items-center justify-center text-nexa-ink hover:text-nexa-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40";

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
  /** Full-width explore canvas vs sticky split panel. */
  sizeVariant?: "default" | "panel";
  /** Called when user explores (initial, CTA, or programmatic). */
  onBoundsChange?: (bounds: MapBounds) => void;
  onSelectCity?: (city: string) => void;
  /**
   * Transient list-card hover highlight (presentation only).
   * Does not spiderfy, zoom, or open clusters when the marker is clustered.
   */
  highlightedId?: string | null;
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
      exploreThisAreaLabel: _exploreThisAreaLabel = "Explore this area",
      myLocationLabel = "My location",
      resetViewLabel = "Reset view",
      zoomOutLabel = "Zoom out",
      currentlyExploringLabel = "Currently exploring",
      staysWord = "stays",
      exploreCityLabel,
      sizeVariant = "default",
      onBoundsChange,
      onSelectCity,
      highlightedId = null,
    },
    ref,
  ) {
    const { locale } = useLanguage();
    const mapEl = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<import("leaflet").Map | null>(null);
    const clusterRef = useRef<MarkerClusterGroup | null>(null);
    const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());
    const userMarkerRef = useRef<import("leaflet").CircleMarker | null>(null);
    const didInitialFrame = useRef(false);
    const skipDirtyOnce = useRef(true);
    const boundsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    }, []);

    const scheduleEmitBounds = useCallback(() => {
      if (boundsTimer.current) clearTimeout(boundsTimer.current);
      boundsTimer.current = setTimeout(() => {
        emitBounds();
      }, BOUNDS_DEBOUNCE_MS);
    }, [emitBounds]);

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
      if (!selected) {
        setPreviewEnter(false);
        return;
      }
      setPreviewEnter(false);
      const id = requestAnimationFrame(() => setPreviewEnter(true));
      return () => {
        cancelAnimationFrame(id);
      };
    }, [selected]);

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
      let settleTimer: ReturnType<typeof setTimeout> | null = null;
      const markers = markersRef.current;

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
          attributionControl: false,
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
          scheduleEmitBounds();
          resolveExploring(map);
        };

        map.on("moveend", onMove);
        map.on("zoomend", onMove);

        mapRef.current = map;
        clusterRef.current = cluster;
        didInitialFrame.current = true;
        setReady(true);
        settleTimer = setTimeout(() => {
          if (cancelled) return;
          map.invalidateSize();
          skipDirtyOnce.current = true;
          emitBounds();
          resolveExploring(map);
        }, 50);
      }

      void init();
      return () => {
        cancelled = true;
        if (settleTimer) clearTimeout(settleTimer);
        if (boundsTimer.current) clearTimeout(boundsTimer.current);
        clusterRef.current?.clearLayers();
        clusterRef.current = null;
        mapRef.current?.remove();
        mapRef.current = null;
        markers.clear();
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
          const label = formatListingPriceLabel(listing, locale);
          const isSelected = listing.id === selectedId;
          const isHighlighted =
            !isSelected && listing.id === highlightedId;
          const icon = await createPriceBubbleIcon(
            label,
            isSelected,
            isHighlighted,
          );
          if (cancelled || !clusterRef.current) return;

          const existing = markersRef.current.get(listing.id);
          if (existing) {
            existing.setLatLng([lat, lng]);
            existing.setIcon(icon);
            existing.setZIndexOffset(isSelected || isHighlighted ? 1000 : 0);
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
    }, [
      mappable,
      ready,
      selectedId,
      highlightedId,
      preferListingsCenter,
      locale,
    ]);

    const goToUser = async () => {
      const coords = userCenter ?? (await readUserLocation());
      if (!coords) return;
      setUserCenter(coords);
      skipDirtyOnce.current = true;
      mapRef.current?.setView([coords.lat, coords.lng], 13, { animate: true });
      scheduleEmitBounds();
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

    const detailHref = selected
      ? listingHref(selected, localePath, checkin, checkout, guests)
      : "#";

    return (
      <div
        className={cn(
          "nexa-explore-map relative z-layer-base isolate overflow-hidden",
          sizeVariant === "panel"
            ? "h-full rounded-none border-0 border-s border-nexa-line/60 shadow-none"
            : "rounded-[20px] border border-nexa-line shadow-lg sm:rounded-3xl",
        )}
      >
        <div
          className={cn(
            "relative w-full",
            sizeVariant === "panel" ? "h-full min-h-[480px]" : "h-[min(72vh,580px)]",
          )}
        >
          <div ref={mapEl} className="h-full w-full bg-nexa-bg-2" />
          {(locating || !ready) && (
            <div className="absolute inset-0 z-layer-content flex items-center justify-center bg-nexa-bg-2/90 text-sm text-nexa-ink-4">
              {locating ? "Finding your location…" : "Loading map…"}
            </div>
          )}

          {/* Compass (decorative) */}
          <div
            className={cn(
              "pointer-events-none absolute left-3 top-3 z-layer-content flex h-11 w-11 items-center justify-center rounded-full text-[0.7rem] font-bold text-nexa-ink",
              MAP_CONTROL,
            )}
            aria-hidden
          >
            N
          </div>

          {/* Map controls */}
          <div className="absolute right-3 top-3 z-layer-content flex flex-col items-center gap-2">
            <div className={cn("flex flex-col overflow-hidden rounded-2xl", MAP_CONTROL)}>
              <button
                type="button"
                onClick={() => mapRef.current?.zoomIn()}
                className={cn(MAP_CONTROL_BTN, "hover:bg-nexa-bg-2")}
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
              <div className="h-px w-full bg-nexa-line/60" />
              <button
                type="button"
                onClick={() => mapRef.current?.zoomOut()}
                className={cn(MAP_CONTROL_BTN, "hover:bg-nexa-bg-2")}
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={() => void goToUser()}
              className={cn(
                MAP_CONTROL_BTN,
                "rounded-full hover:bg-nexa-bg-2",
                MAP_CONTROL,
              )}
              aria-label={myLocationLabel}
              title={myLocationLabel}
            >
              <LocateFixed className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={resetView}
              className={cn(
                MAP_CONTROL_BTN,
                "rounded-full hover:bg-nexa-bg-2",
                MAP_CONTROL,
              )}
              aria-label={resetViewLabel}
              title={resetViewLabel}
            >
              <Home className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* Currently exploring chip */}
          {exploringName && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-layer-content flex justify-center px-4">
              <div
                key={exploringKey}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs text-nexa-ink animate-[nexaExploreSlide_150ms_ease-out]",
                  MAP_CONTROL,
                )}
              >
                <span className="text-nexa-ink-4">{currentlyExploringLabel}</span>{" "}
                <span className="font-semibold">{exploringName}</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {ready && mappable.length === 0 && (
            <div className="absolute inset-x-0 top-1/2 z-layer-content flex -translate-y-1/2 justify-center px-4">
              <div
                className={cn(
                  "max-w-sm rounded-3xl px-5 py-4 text-center",
                  MAP_CONTROL,
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
                    className="rounded-full border border-nexa-line bg-white px-3 py-1.5 text-xs font-semibold text-nexa-ink hover:border-nexa-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
                  >
                    {zoomOutLabel}
                  </button>
                  {city && onSelectCity && (
                    <button
                      type="button"
                      onClick={() => onSelectCity(city)}
                      className="rounded-full bg-nexa-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-nexa-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexa-primary/40"
                    >
                      {exploreCityLabel || city}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <ExploreMapAttribution />
        </div>

        {selected && (
          <ExploreMapListingPreview
            listing={selected}
            detailHref={detailHref}
            viewStayLabel={viewStayLabel}
            previewEnter={previewEnter}
            sizeVariant={sizeVariant}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    );
  },
);
