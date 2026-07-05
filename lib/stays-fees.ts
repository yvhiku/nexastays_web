/**
 * Platform fee rates from Stays API (guest + host service fees).
 */

import axios from "axios";
import { getStaysApiBaseUrl } from "./env";

export type StaysFeeRates = {
  guest_fee_pct: number;
  host_fee_pct: number;
  guest_fee_percent: number;
  host_fee_percent: number;
  total_commission_percent: number;
};

export const DEFAULT_FEE_RATES: StaysFeeRates = {
  guest_fee_pct: 0.05,
  host_fee_pct: 0.05,
  guest_fee_percent: 5,
  host_fee_percent: 5,
  total_commission_percent: 10,
};

export async function fetchStaysFeeRates(): Promise<StaysFeeRates> {
  try {
    const { data } = await axios.get<StaysFeeRates>(
      `${getStaysApiBaseUrl()}/stays/config/fees`,
      { timeout: 8000 },
    );
    return data;
  } catch {
    return DEFAULT_FEE_RATES;
  }
}

export function calculateBookingFees(
  subtotal: number,
  rates: StaysFeeRates = DEFAULT_FEE_RATES,
) {
  const guestFee =
    Math.round(subtotal * rates.guest_fee_pct * 100) / 100;
  const hostFee =
    Math.round(subtotal * rates.host_fee_pct * 100) / 100;
  return {
    guestFee,
    hostFee,
    totalGuestPays: subtotal + guestFee,
    hostPayout: subtotal - hostFee,
    platformRevenue: guestFee + hostFee,
  };
}

export function formatFeePercent(value: number): string {
  return Number.isInteger(value) ? `${value}` : `${value}`;
}
