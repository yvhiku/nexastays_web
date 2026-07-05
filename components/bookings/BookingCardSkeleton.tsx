"use client";

import React from "react";

export function BookingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-nexa-line/70 bg-white overflow-hidden animate-pulse">
      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-[260px] aspect-[4/3] lg:aspect-auto lg:min-h-[200px] bg-nexa-bg-2" />
        <div className="flex-1 p-6 space-y-3">
          <div className="h-5 bg-nexa-bg-2 rounded-lg w-3/4" />
          <div className="h-4 bg-nexa-bg-2 rounded-lg w-1/3" />
          <div className="h-4 bg-nexa-bg-2 rounded-lg w-1/2" />
          <div className="h-6 bg-nexa-bg-2 rounded-lg w-24 mt-4" />
        </div>
        <div className="hidden sm:flex flex-col gap-2 p-6 w-40">
          <div className="h-9 bg-nexa-bg-2 rounded-xl" />
          <div className="h-9 bg-nexa-bg-2 rounded-xl" />
        </div>
      </div>
      <div className="h-10 bg-nexa-bg-1 border-t border-nexa-line/50" />
    </div>
  );
}

export function BookingListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading bookings">
      {Array.from({ length: count }).map((_, i) => (
        <BookingCardSkeleton key={i} />
      ))}
    </div>
  );
}
