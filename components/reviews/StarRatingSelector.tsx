"use client";

import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

interface StarRatingSelectorProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: "sm" | "lg";
}

export function StarRatingSelector({
  value,
  onChange,
  disabled,
  size = "lg",
}: StarRatingSelectorProps) {
  const iconSize = size === "lg" ? "h-10 w-10" : "h-6 w-6";

  const handleClick = (starIndex: number, isLeftHalf: boolean) => {
    if (disabled) return;
    const rating = isLeftHalf ? starIndex + 0.5 : starIndex + 1;
    onChange(rating);
  };

  return (
    <div
      className="flex items-center justify-center gap-1"
      role="radiogroup"
      aria-label="Overall rating"
    >
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, value - i));
        return (
          <div key={i} className="relative">
            <Star
              className={cn(iconSize, "text-nexa-line/60")}
              aria-hidden
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star
                className={cn(iconSize, "text-amber-400 fill-amber-400")}
                aria-hidden
              />
            </div>
            <button
              type="button"
              disabled={disabled}
              className="absolute inset-y-0 left-0 w-1/2 cursor-pointer disabled:cursor-not-allowed"
              aria-label={`${i + 0.5} stars`}
              onClick={() => handleClick(i, true)}
            />
            <button
              type="button"
              disabled={disabled}
              className="absolute inset-y-0 right-0 w-1/2 cursor-pointer disabled:cursor-not-allowed"
              aria-label={`${i + 1} stars`}
              onClick={() => handleClick(i, false)}
            />
          </div>
        );
      })}
      <span className="ml-3 text-sm font-semibold text-nexa-ink tabular-nums min-w-[2rem]">
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

export function StarRatingDisplay({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        return (
          <div key={i} className="relative">
            <Star className={cn(iconSize, "text-nexa-line/50")} aria-hidden />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star className={cn(iconSize, "text-amber-400 fill-amber-400")} aria-hidden />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { STEPS };
