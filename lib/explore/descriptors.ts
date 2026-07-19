import type { DescriptorId } from "./types";

/** Maps semantic descriptor IDs to i18n keys under explore.descriptors.* */
export const DESCRIPTOR_I18N_KEYS: Record<DescriptorId, string> = {
  historic_medina: "explore.descriptors.historic_medina",
  historic: "explore.descriptors.historic",
  beachfront: "explore.descriptors.beachfront",
  oceanfront: "explore.descriptors.oceanfront",
  waterfront: "explore.descriptors.waterfront",
  marina: "explore.descriptors.marina",
  shopping_cafes: "explore.descriptors.shopping_cafes",
  shopping: "explore.descriptors.shopping",
  business_district: "explore.descriptors.business_district",
  business: "explore.descriptors.business",
  luxury_living: "explore.descriptors.luxury_living",
  luxury: "explore.descriptors.luxury",
  art_culture: "explore.descriptors.art_culture",
  family_friendly: "explore.descriptors.family_friendly",
  family: "explore.descriptors.family",
  nightlife: "explore.descriptors.nightlife",
  university_area: "explore.descriptors.university_area",
  residential: "explore.descriptors.residential",
  mountain_escape: "explore.descriptors.mountain_escape",
  surf_spot: "explore.descriptors.surf_spot",
  surf: "explore.descriptors.surf",
  quiet_retreat: "explore.descriptors.quiet_retreat",
  food_dining: "explore.descriptors.food_dining",
  nature: "explore.descriptors.nature",
  golf: "explore.descriptors.golf",
};

export function descriptorI18nKey(id: DescriptorId): string {
  return DESCRIPTOR_I18N_KEYS[id];
}

export const ALL_DESCRIPTOR_IDS = Object.keys(
  DESCRIPTOR_I18N_KEYS,
) as DescriptorId[];
