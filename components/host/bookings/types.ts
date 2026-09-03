export type HostBookingsExportState = {
  period: "last_30_days" | "this_year" | "all" | "custom";
  from: string;
  to: string;
  listingId: string;
  status: string;
};
