import type { SearchBarValue } from "./types";

export type SearchActiveStep = null | "destination" | "dates" | "guests";

export type SearchCtaMode = "chooseDestination" | "chooseDates" | "searchStays";

export function hasDestination(value: SearchBarValue): boolean {
  return Boolean(value.destinationId || value.city.trim());
}

export function hasDates(value: SearchBarValue): boolean {
  return Boolean(value.checkin && value.checkout);
}

export function isSearchReady(value: SearchBarValue): boolean {
  return hasDestination(value) && hasDates(value);
}

export function resolveSearchCtaMode(value: SearchBarValue): SearchCtaMode {
  if (!hasDestination(value)) return "chooseDestination";
  if (!hasDates(value)) return "chooseDates";
  return "searchStays";
}

export function nextIncompleteStep(value: SearchBarValue): Exclude<SearchActiveStep, null> {
  if (!hasDestination(value)) return "destination";
  if (!hasDates(value)) return "dates";
  return "guests";
}
