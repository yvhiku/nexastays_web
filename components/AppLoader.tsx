"use client";

import React from "react";

/** Shown while auth is initializing to avoid flash of blank content */
export function AppLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-nexa-bg">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nexa-primary" />
    </div>
  );
}
