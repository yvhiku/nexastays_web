"use client";

import React from "react";
import Link from "next/link";
import { Shield, FileText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StaysListing } from "@/lib/stays-types";

interface ListingBookingCardProps {
  listing: StaysListing;
  checkin: string;
  checkout: string;
  guests: number;
  maxGuests: number;
  nights: number;
  price: number;
  cleaningFee: number;
  guestFee: number;
  guestFeeLabel: string;
  total: number;
  currency: string;
  booking: boolean;
  bookingError: string | null;
  isAuthenticated: boolean;
  userProfile: { kyc_status: string } | null;
  localePath: (p: string) => string;
  onCheckinChange: (v: string) => void;
  onCheckoutChange: (v: string) => void;
  onGuestsChange: (v: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ListingBookingCard({
  listing,
  checkin,
  checkout,
  guests,
  maxGuests,
  nights,
  price,
  cleaningFee,
  guestFee,
  guestFeeLabel,
  total,
  currency,
  booking,
  bookingError,
  isAuthenticated,
  userProfile,
  localePath,
  onCheckinChange,
  onCheckoutChange,
  onGuestsChange,
  onSubmit,
}: ListingBookingCardProps) {
  const kycBlocked =
    isAuthenticated &&
    userProfile &&
    userProfile.kyc_status !== "APPROVED" &&
    userProfile.kyc_status !== "VERIFIED";

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="md:sticky md:top-[100px] bg-white/80 backdrop-blur-xl rounded-2xl shadow-nexa-card border border-white p-6">
      <div className="flex items-baseline justify-between mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-nexa-ink">{price}</span>
          <span className="text-nexa-ink-4 text-sm">{currency} / night</span>
        </div>
        {listing.instant_booking && (
          <span className="flex items-center gap-1 text-xs font-semibold text-nexa-primary">
            <Star className="w-3.5 h-3.5 fill-nexa-primary" />
            Instant
          </span>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 border border-nexa-line rounded-xl overflow-hidden">
          <div className="p-3 border-b sm:border-b-0 sm:border-r border-nexa-line">
            <label className="block text-[10px] font-bold uppercase text-nexa-ink-4 tracking-wide">
              Check-in
            </label>
            <input
              type="date"
              value={checkin}
              onChange={(e) => onCheckinChange(e.target.value)}
              required
              min={today}
              className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 focus:outline-none"
            />
          </div>
          <div className="p-3">
            <label className="block text-[10px] font-bold uppercase text-nexa-ink-4 tracking-wide">
              Check-out
            </label>
            <input
              type="date"
              value={checkout}
              onChange={(e) => onCheckoutChange(e.target.value)}
              required
              min={checkin || today}
              className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 focus:outline-none"
            />
          </div>
          <div className="p-3 border-t border-nexa-line col-span-2">
            <label className="block text-[10px] font-bold uppercase text-nexa-ink-4 tracking-wide">
              Guests
            </label>
            <select
              value={guests}
              onChange={(e) => onGuestsChange(parseInt(e.target.value, 10))}
              className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 focus:outline-none"
            >
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} guest{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {kycBlocked && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            Verification pending. Booking unlocks after approval.{" "}
            <Link href={localePath("/registration")} className="text-nexa-primary font-medium hover:underline">
              Complete verification
            </Link>
          </div>
        )}

        {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}

        <Button
          type="submit"
          className="w-full justify-center py-6 text-base font-bold rounded-xl bg-nexa-primary-soft text-nexa-primary-dark hover:bg-nexa-primary/20 border-0 shadow-md"
          disabled={booking || !checkin || !checkout || !!kycBlocked}
        >
          {booking ? "Booking…" : isAuthenticated ? "Request to Book" : "Sign in to Book"}
        </Button>

        <p className="text-center text-xs text-nexa-ink-4">You won&apos;t be charged yet</p>

        {nights > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-nexa-ink-3">
                {price} × {nights} night{nights > 1 ? "s" : ""}
              </span>
              <span>{price * nights} {currency}</span>
            </div>
            {cleaningFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-nexa-ink-3">Cleaning fee</span>
                <span>{cleaningFee} {currency}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-nexa-ink-3">Guest fee ({guestFeeLabel})</span>
              <span>{guestFee} {currency}</span>
            </div>
            <hr className="border-nexa-line/60" />
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span>
              <span>{total.toFixed(2)} {currency}</span>
            </div>
          </div>
        )}

        <div className="pt-4 mt-4 border-t border-nexa-line/60 space-y-3">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-green-700 shrink-0" />
            <span className="text-xs font-medium text-nexa-ink-3">Secure SSL Payment</span>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-green-700 shrink-0" />
            <span className="text-xs font-medium text-nexa-ink-3">Free cancellation within 48 hours</span>
          </div>
        </div>

        {!isAuthenticated && (
          <p className="text-xs text-nexa-ink-4 text-center">
            Identity verification required. Sign in to book.
          </p>
        )}
      </form>
    </div>
  );
}
