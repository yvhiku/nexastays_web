/**
 * Moroccan cities for listing filters, host onboarding, and profile/registration.
 * Derived from Level-1 destination catalog only (hosts cannot pick tourist spots / landmarks).
 */
import { listingCitiesFromCatalog } from "@/lib/destinations";

export const MOROCCO_CITIES: readonly string[] = listingCitiesFromCatalog();
