"use client";

import { useEffect } from "react";
import { startClientErrorMonitoring } from "@/lib/monitoring";

export function ClientMonitoring() {
  useEffect(() => startClientErrorMonitoring(), []);
  return null;
}
