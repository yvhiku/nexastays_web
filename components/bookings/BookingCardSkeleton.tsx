"use client";

import React from "react";

export function BookingCardSkeleton() {
  return (
    <div className="rounded-xl border border-nexa-line/60 bg-white overflow-hidden animate-pulse">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-[160px] h-[120px] sm:min-h-[132px] bg-nexa-bg-2 shrink-0" />
        <div className="flex-1 px-4 py-3 space-y-2 border-r border-nexa-line/40">
          <div className="h-4 bg-nexa-bg-2 rounded w-3/4" />
          <div className="h-3 bg-nexa-bg-2 rounded w-1/3" />
          <div className="h-3 bg-nexa-bg-2 rounded w-1/2" />
        </div>
        <div className="hidden sm:flex flex-col gap-1.5 p-3 w-[156px]">
          <div className="h-8 bg-nexa-bg-2 rounded-lg" />
          <div className="h-8 bg-nexa-bg-2 rounded-lg" />
        </div>
      </div>
      <div className="h-8 bg-nexa-bg-1 border-t border-nexa-line/40" />
    </div>
  );
}

export function BookingListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading bookings">
      {Array.from({ length: count }).map((_, i) => (
        <BookingCardSkeleton key={i} />
      ))}
    </div>
  );
}
