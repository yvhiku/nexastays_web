"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/Alert";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ListingCard } from "@/components/listing/ListingCard";
import { ListingGridSkeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getListing } from "@/lib/stays-api";
import { formatUserError } from "@/lib/errors";
import { getSavedListingIds } from "@/lib/saved-listings";
import type { StaysListing } from "@/lib/stays-types";

function SavedListingsContent() {
  const { token, userId } = useAuth();
  const { t, localePath } = useLanguage();
  const [listings, setListings] = useState<StaysListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError(null);
    const ids = getSavedListingIds(userId);
    if (ids.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }
    try {
      const results = await Promise.all(
        ids.map((id) => getListing(id, token).catch(() => null)),
      );
      setListings(results.filter((l): l is StaysListing => l != null));
    } catch (e) {
      setError(formatUserError(e) || t("savedListings.failedLoad"));
    } finally {
      setLoading(false);
    }
  }, [token, userId, t]);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  useEffect(() => {
    const onChange = () => void loadSaved();
    window.addEventListener("nexa-saved-listings-changed", onChange);
    return () => window.removeEventListener("nexa-saved-listings-changed", onChange);
  }, [loadSaved]);

  return (
    <>
      <NavBar />
      <main className="pt-[72px] min-h-screen bg-nexa-bg">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-nexa-ink flex items-center gap-2">
              <Bookmark className="h-7 w-7 text-nexa-primary" />
              {t("savedListings.title")}
            </h1>
            <p className="text-nexa-ink-3 mt-2">{t("savedListings.subtitle")}</p>
            <p className="text-xs text-nexa-ink-4 mt-1">{t("savedListings.deviceOnly")}</p>
          </div>

          {error && (
            <ErrorAlert
              error={error}
              className="mb-6"
              onDismiss={() => setError(null)}
            />
          )}

          {loading ? (
            <ListingGridSkeleton variant="saved" />
          ) : listings.length === 0 ? (
            <div className="mx-auto max-w-md text-center py-16">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-nexa-primary-soft">
                <Bookmark className="h-8 w-8 text-nexa-primary" />
              </div>
              <p className="text-xl font-semibold text-nexa-ink mb-2">
                {t("savedListings.emptyTitle")}
              </p>
              <p className="text-sm text-nexa-ink-3 mb-8">
                {t("savedListings.emptySubtitle")}
              </p>
              <Button asChild>
                <Link href={localePath("/")}>{t("savedListings.browseStays")}</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  t={t}
                  localePath={localePath}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function SavedListingsPage() {
  return (
    <ProtectedRoute>
      <SavedListingsContent />
    </ProtectedRoute>
  );
}
