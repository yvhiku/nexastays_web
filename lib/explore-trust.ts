export type ExploreTrustItem = {
  id: string;
  labelKey: string;
};

export const EXPLORE_TRUST_ITEMS: ExploreTrustItem[] = [
  { id: "hosts", labelKey: "explore.trustVerifiedHosts" },
  { id: "location", labelKey: "explore.trustAccurateLocations" },
  { id: "payments", labelKey: "explore.trustSecurePayments" },
  { id: "support", labelKey: "explore.trustLocalSupport" },
];

export const EXPLORE_TRUST_LEARN_MORE_PATH = "/safety-transparency";
